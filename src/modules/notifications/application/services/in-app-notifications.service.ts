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

  async countTotal(tenantId: string, userId: string) {
    return this.inAppRepository.countTotal(tenantId, userId);
  }

  async countUnread(tenantId: string, userId: string) {
    return this.inAppRepository.countUnread(tenantId, userId);
  }

  async findPage(tenantId: string, userId: string, limit: number, cursor?: string) {
    return this.inAppRepository.findPage(tenantId, userId, limit, cursor);
  }

  async markAsRead(id: string, tenantId: string, userId: string) {
    return this.inAppRepository.markAsRead(id, tenantId, userId);
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.inAppRepository.markAllAsRead(tenantId, userId);
  }

  async send(notification: Notification, content: BuildInAppResponse, userId: string) {
    if (!notification.tenantId || !userId) {
      throw new Error('Tenant ID or recipient ID is required for in-app notifications');
    }
    const data = await this.inAppRepository.create({
      user: { connect: { id: userId } },
      tenant: { connect: { id: notification.tenantId } },
      notification: { connect: { id: notification.id } },
      type: notification.type,
      title: content.title,
      message: content.message,
      actionUrl: content.actionUrl,
      actionLabel: content.actionLabel,
      action: content.action,
    });

    this.eventEmitter.emit('in_app_notification.created', {
      userId,
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
