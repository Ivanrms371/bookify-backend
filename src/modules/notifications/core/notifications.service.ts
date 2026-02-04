import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload, NotificationResult } from '../types/notification.type';
import { NotificationLogRepository } from '../analytics/repositories/notification-log.repository';
import { LimitTrackerService } from './limit-tracker.service';
import { EmailService } from './emails/services/email.service';
import { WhatsappService } from './whatsapp.service';
import {
  NotificationChannel,
  NotificationLayer,
  NotificationStatus,
} from 'src/generated/prisma/enums';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationLogRepository: NotificationLogRepository,
    private readonly limitTracker: LimitTrackerService,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {}

  async send(payload: NotificationPayload) {
    const { businessId, contact } = payload;

    let channel: NotificationChannel = payload.channel;

    if (businessId && contact.phone) {
      channel = await this.limitTracker.checkChannel(businessId, contact);
    }

    const result = await this.sendViaChannel(channel, payload);
    if (result.error) {
      this.recordFailure(payload, channel, result);
    } else {
      this.recordSuccess(payload, channel, result);
    }
  }

  private async sendViaChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    switch (channel) {
      case NotificationChannel.WHATSAPP:
        return this.whatsappService.send(payload);
      case NotificationChannel.EMAIL:
        return this.emailService.send(payload);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private recordSuccess(
    payload: NotificationPayload,
    channel: NotificationChannel,
    result: NotificationResult,
  ) {
    const { provider, providerMessageId, cost = 0 } = result;
    Promise.all([
      this.notificationLogRepository.create({
        business: {
          connect: {
            id: payload.businessId,
          },
        },
        provider,
        providerMessageId,
        cost,
        layer: NotificationLayer.BUSINESS,
        type: payload.type,
        channel,
        status: NotificationStatus.SENT,
        scheduledNotification: payload.scheduledNotificationId
          ? { connect: { id: payload.scheduledNotificationId } }
          : undefined,
      }),
      payload.businessId
        ? this.limitTracker.increment(payload.businessId, channel, result.cost || 0)
        : Promise.resolve(),
    ]).catch((err) => {
      this.logger.error('Failed to record notification', err);
    });
  }

  private recordFailure(
    payload: NotificationPayload,
    channel: NotificationChannel,
    result: NotificationResult,
  ) {
    const { error, provider } = result;
    this.notificationLogRepository
      .create({
        type: payload.type,
        channel,
        layer: payload.businessId ? NotificationLayer.BUSINESS : NotificationLayer.PLATFORM,
        business: { connect: { id: payload.businessId } },
        status: NotificationStatus.FAILED,
        error,
        provider,
        cost: 0,
        scheduledNotification: payload.scheduledNotificationId
          ? { connect: { id: payload.scheduledNotificationId } }
          : undefined,
      })
      .catch((err) => {
        this.logger.error('Failed to record error', err);
      });
  }
}
