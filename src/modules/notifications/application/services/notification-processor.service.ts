import { WhatsappGateway } from '../../infraestructure/gateways/whatsapp.gateway';
import { NotificationFinalizationService } from './notification-finalization.service';
import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from './template.service';
import { NotificationGatewaysService } from '../../infraestructure/gateways/notification-gateways.service';
import { NotificationLogsRepository } from '../../infraestructure/repositories/notification-logs.repository';
import { NotificationDeliveryRepository } from '../../infraestructure/repositories/notification-delivery.repository';
import { NotificationConfigService } from '../../notification-config.service';
import type { NotificationProcessorInput } from '../../types/notification-processor.type';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationUsageService } from './notification-usage.service';
import { CostProtectionError } from '../../errors/cost-protection.error';
import { DeliveryRejectedError } from '../../errors/delivery-rejected.error';
import { NotImplementedError } from '../../errors/not-implemented.error';
import { SimulatedDeliveryError } from '../../errors/simulated-delivery.error';
import { DeliverySkippedError } from '../../errors/delivery-skipped.error';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);
  private readonly CONCURRENCY = 5;

  constructor(
    private readonly usageService: NotificationUsageService,
    private readonly templateService: TemplateService,
    private readonly gateways: NotificationGatewaysService,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly logRepository: NotificationLogsRepository,
    private readonly configService: NotificationConfigService,
    private readonly finalization: NotificationFinalizationService,
  ) {}

  private async process(delivery: NotificationProcessorInput) {
    const { channel, notification, retryCount, id: deliveryId } = delivery;
    const { type, id: notificationId } = notification;

    if (!(await this.deliveryRepository.claim(deliveryId, retryCount))) return;
    let providerAttempted = false;
    let providerAccepted = false;
    try {
      if (notification.expiresAt && notification.expiresAt <= new Date()) {
        await this.deliveryRepository.markAsExpired(deliveryId);
        return;
      }
      const template = this.templateService.build(type, channel, notification.payload as Record<string, any>);
      // Resolve channel eligibility before reserving quota or attempting a provider send.
      const recipient = await this.gateways.prepare(channel, notification);
      // The current WhatsApp adapter only logs payloads; it consumes no paid capacity.
      const canSend =
        (channel === NotificationChannel.WHATSAPP && !WhatsappGateway.isOperational()) || (await this.usageService.reserve(delivery));
      if (!canSend) {
        throw new CostProtectionError();
      }

      if (notification.expiresAt && notification.expiresAt <= new Date()) {
        await this.usageService.release(deliveryId);
        await this.deliveryRepository.markAsExpired(deliveryId);
        return;
      }
      providerAttempted = true;
      const referenceId = await this.gateways.send(channel, notification, template, deliveryId, recipient);

      providerAccepted = true;
      await this.finalization.recordAcceptance(deliveryId, referenceId, notification.tenantId);
      await this.finalization.resolve({
        deliveryId,
        tenantId: notification.tenantId,
        outcome: 'accepted',
        source: 'worker',
        operator: 'notification-worker',
        evidence: 'Gateway accepted send',
        providerId: referenceId,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Delivery ${deliveryId} failed: ${err.message}`, err.stack);

      // Never retry an accepted send because local persistence/logging failed.
      // Keep its claim for reconciliation if marking SENT failed.
      if (providerAccepted) return;
      if (
        !providerAttempted ||
        err instanceof DeliveryRejectedError ||
        err instanceof NotImplementedError ||
        err instanceof SimulatedDeliveryError
      ) {
        await this.usageService.release(deliveryId);
      } else {
        await this.usageService.retain(deliveryId);
        // Keep the claim and reservation until provider evidence resolves the outcome.
        // Never blindly retry outside the provider's idempotency retention window.
        await this.logRepository.createErrorLog(deliveryId, 'RECONCILIATION_REQUIRED: uncertain provider acceptance');
        return;
      }
      await this.logRepository.createErrorLog(deliveryId, err.message);

      if (err instanceof SimulatedDeliveryError || err instanceof DeliverySkippedError) {
        await this.deliveryRepository.markAsFailed(deliveryId, err.message);
        if (
          err instanceof DeliverySkippedError ||
          notification.type.startsWith('appointment.') ||
          notification.type === 'customer.verification'
        ) {
          const fallback = this.configService.getChannelConfig(type, notification.recipientType, channel)?.fallback;
          if (fallback?.length) await this.createFallback(notificationId, fallback);
        }
        return;
      }

      const retryPolicy = this.configService.getRetryPolicy(type, notification.recipientType, channel);
      const channelConfig = this.configService.getChannelConfig(type, notification.recipientType, channel);

      const isPermanentError = err instanceof CostProtectionError || err instanceof NotImplementedError;

      const canRetry = !isPermanentError && retryPolicy.retryable && retryCount < retryPolicy.maxRetries;

      if (canRetry) {
        const nextRunAt = this.getNextRetry(type, notification.recipientType, channel, retryCount);

        await this.deliveryRepository.incrementRetries(deliveryId, {
          runAt: nextRunAt,
          errorMessage: err.message,
        });
        return;
      }

      await this.deliveryRepository.markAsFailed(deliveryId, err.message);

      if (channelConfig?.fallback?.length) {
        this.logger.log(`Triggering fallback for delivery ${deliveryId} on notification ${notificationId}`);
        await this.createFallback(notificationId, channelConfig.fallback);
      }
    }
  }

  async processBatch(limit = 50) {
    const pendingDeliveries = await this.deliveryRepository.findPendingToProcess(limit);

    if (pendingDeliveries.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingDeliveries.length} pending notifications...`);

    for (let i = 0; i < pendingDeliveries.length; i += this.CONCURRENCY) {
      const batch = pendingDeliveries.slice(i, i + this.CONCURRENCY);
      await Promise.all(batch.map((delivery) => this.process(delivery)));
    }
  }

  async processNotification(notificationId: string) {
    const pendingDeliveries = await this.deliveryRepository.findPendingByNotification(notificationId);
    for (let i = 0; i < pendingDeliveries.length; i += this.CONCURRENCY) {
      const batch = pendingDeliveries.slice(i, i + this.CONCURRENCY);
      await Promise.all(batch.map((delivery) => this.process(delivery)));
    }
  }

  private async createFallback(notificationId: string, fallbackChannels: NotificationChannel[]) {
    for (const channel of fallbackChannels) {
      await this.deliveryRepository.ensureFallback(notificationId, channel);
    }
  }

  private getNextRetry(type: string, recipientType: RecipientType, channel: NotificationChannel, retryCount: number): Date {
    const retryPolicy = this.configService.getRetryPolicy(type, recipientType, channel);
    const delays = retryPolicy.backoffDelays ?? [60_000, 300_000, 900_000];

    const delay = delays[retryCount] ?? delays[delays.length - 1] ?? 60_000;

    const runAt = new Date(Date.now() + delay);
    runAt.setMilliseconds(0);
    return runAt;
  }
}
