import { DeliveryRejectedError } from '../../errors/delivery-rejected.error';
import { DeliverySkippedError } from '../../errors/delivery-skipped.error';
import { Injectable } from '@nestjs/common';
import { NotificationChannel, Notification } from 'src/generated/prisma/client';
import { EmailGateway } from './email.gateway';
import { WhatsappGateway } from './whatsapp.gateway';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';
import { InAppNotificationsService } from '../../application/services/in-app-notifications.service';
import { NotificationRecipientResolver } from '../../application/services/notification-recipient-resolver.service';

@Injectable()
export class NotificationGatewaysService {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly whatsappGateway: WhatsappGateway,
    private readonly inAppService: InAppNotificationsService,
    private readonly recipientResolver: NotificationRecipientResolver,
  ) {}

  async send(
    channel: NotificationChannel,
    notification: Notification,
    template: BuildEmailResponse | BuildInAppResponse | BuildWhatsappResponse,
    deliveryId?: string,
    preparedRecipient?: string,
  ) {
    const recipient =
      notification.recipientType === 'CUSTOMER' && notification.type === 'customer.verification'
        ? await this.prepare(channel, notification)
        : (preparedRecipient ?? (await this.prepare(channel, notification)));
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.emailGateway.send(recipient, template as BuildEmailResponse, deliveryId);
      case NotificationChannel.WHATSAPP:
        return await this.whatsappGateway.send(recipient, template as BuildWhatsappResponse);
      case NotificationChannel.IN_APP:
        return await this.inAppService.send(notification, template as BuildInAppResponse, recipient);
      default:
        throw new Error('Unsupported notification channel');
    }
  }

  async prepare(channel: NotificationChannel, notification: Notification) {
    try {
      return await this.recipientResolver.resolve(channel, notification);
    } catch (error) {
      if (error instanceof DeliverySkippedError) throw error;
      throw new DeliveryRejectedError(error instanceof Error ? error.message : String(error));
    }
  }
}
