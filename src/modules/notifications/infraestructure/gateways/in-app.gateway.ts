import { Injectable } from '@nestjs/common';
import { InAppNotificationsRepository } from '../repositories/in-app-notifications.repository';
import { Notification } from 'src/generated/prisma/client';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';

@Injectable()
export class InAppGateway {
  constructor(private readonly inAppNotificationsRepository: InAppNotificationsRepository) {}

  async send(notification: Notification, content: BuildInAppResponse) {
    if (!notification.tenantId) {
      throw new Error('Tenant ID is required for in-app notifications');
    }
    const data = await this.inAppNotificationsRepository.create({
      user: { connect: { id: notification.recipientId } },
      tenant: { connect: { id: notification.tenantId } },
      notification: { connect: { id: notification.id } },
      type: notification.type,
      title: content.title,
      message: content.message,
    });
    return data.id;
  }
}
