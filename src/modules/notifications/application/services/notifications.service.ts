import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationConfigService } from '../../notification-config.service';
import { NotificationsRepository } from '../../infraestructure/repositories/notifications.repository';
import { NotificationDeliveryRepository } from '../../infraestructure/repositories/notification-delivery.repository';
import { TemplateService } from './template.service';
import { EmailGateway } from '../../infraestructure/gateways/email.gateway';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: NotificationConfigService,
    private readonly notificationRepository: NotificationsRepository,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly templateService: TemplateService,
    private readonly emailGateway: EmailGateway,
  ) {}

  private resolveChannels(type: string, recipientType: RecipientType) {
    const config = this.configService.getChannels(type, recipientType);
    const channels = config.map((channel) => channel.channel);
    if (!channels.length) {
      throw new Error('No channels found for notification type');
    }
    return channels;
  }

  async create(params: {
    type: string;
    businessId?: string;
    recipientId: string;
    recipientType: RecipientType;
    payload: Record<string, any>;
    executeAt?: Date;
  }) {
    const notification = await this.notificationRepository.create({
      type: params.type,
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      payload: params.payload,
      businessId: params.businessId,
    });

    const channels = this.resolveChannels(params.type, params.recipientType);

    const deliveries = channels.map((channel) => ({
      notificationId: notification.id,
      runAt: params.executeAt,
      channel,
    }));

    await this.deliveryRepository.createMany(deliveries);

    if (!params.executeAt) {
      this.eventEmitter.emit('notification.process', notification.id);
    }

    return notification;
  }
  async sendDirectlyEmail(params: { to: string; type: string; payload: Record<string, any> }) {
    const { to, type, payload } = params;
    try {
      const template = this.templateService.build(type, NotificationChannel.EMAIL, payload) as BuildEmailResponse;

      if (!template) {
        throw new Error('Template not found');
      }

      await this.emailGateway.sendDirectly(to, template);
    } catch (error) {
      console.log(error);
    }
  }
}
