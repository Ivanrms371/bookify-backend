import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from './template.service';
import { NotificationGatewaysService } from '../../infraestructure/gateways/notification-gateways.service';
import { NotificationLogsRepository } from '../../infraestructure/repositories/notification-logs.repository';
import { NotificationDeliveryRepository } from '../../infraestructure/repositories/notification-delivery.repository';
import { NotificationConfigService } from '../../notification-config.service';
import { NotificationProcessorInput } from '../../types/notification-processor.type';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationUsageService } from './notification-usage.service';
import { CostProtectionError } from '../../errors/cost-protection.error';
import { NotImplementedError } from '../../errors/not-implemented.error';

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
  ) {}

  private async process(delivery: NotificationProcessorInput) {
    const { channel, notification, retryCount, id: deliveryId } = delivery;
    const { payload, type, id: notificationId } = notification;

    try {
      const canSend = await this.usageService.canSend(notification.tenantId, channel);
      if (!canSend) {
        throw new CostProtectionError();
      }

      const template = this.templateService.build(type, channel, payload as Record<string, any>);
      const referenceId = await this.gateways.send(channel, notification, template);

      await this.deliveryRepository.markAsSent(delivery.id, referenceId);
      await this.usageService.incrementUsage(notification.tenantId, channel);
      await this.logRepository.createSuccessLog(delivery.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Delivery ${deliveryId} failed: ${err.message}`, err.stack);

      await this.logRepository.createErrorLog(deliveryId, err.message);

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
      const exists = await this.deliveryRepository.exists(notificationId, channel);
      if (exists) continue;
      await this.deliveryRepository.create({
        notification: { connect: { id: notificationId } },
        runAt: new Date(),
        channel,
      });
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
