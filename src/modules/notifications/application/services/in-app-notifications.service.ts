import { Injectable } from '@nestjs/common';
import { InAppNotificationsRepository } from '../../infraestructure/repositories/in-app-notifications.repository';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';
import { Notification } from 'src/generated/prisma/client';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class InAppNotificationsService {
  constructor(
    private readonly inAppRepository: InAppNotificationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async countUnread(userId: string) {
    return this.inAppRepository.countUnread(userId);
  }

  async findLatest(userId: string) {
    return this.inAppRepository.findMany(userId, 10);
  }

  async markAsRead(id: string, userId: string) {
    return this.inAppRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.inAppRepository.markAllAsRead(userId);
  }

  async send(notification: Notification, content: BuildInAppResponse) {
    if (!notification.tenantId || !notification.recipientId) {
      throw new Error('Tenant ID or recipient ID is required for in-app notifications');
    }
    const data = await this.inAppRepository.create({
      user: { connect: { id: notification.recipientId } },
      tenant: { connect: { id: notification.tenantId } },
      notification: { connect: { id: notification.id } },
      type: notification.type,
      title: content.title,
      message: content.message,
    });

    this.eventEmitter.emit('in_app_notification.created', {
      userId: notification.recipientId,
      tenantId: notification.tenantId,
      title: content.title,
      message: content.message,
      actionUrl: content.actionUrl,
      type: notification.type,
      readAt: null,
      createdAt: new Date(),
    });

    return data.id;
  }
}
