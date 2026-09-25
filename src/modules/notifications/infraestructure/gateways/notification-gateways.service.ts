import { Injectable } from '@nestjs/common';
import { NotificationChannel, Notification } from 'src/generated/prisma/client';
import { EmailGateway } from './email.gateway';
import { WhatsappGateway } from './whatsapp.gateway';
import { ChannelContentMap, EmailContent, InAppContent, WhatsAppContent } from '../../types/template.type';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';
import { InAppNotificationsService } from '../../application/services/in-app-notifications.service';

@Injectable()
export class NotificationGatewaysService {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly whatsappGateway: WhatsappGateway,
    private readonly inAppService: InAppNotificationsService,
  ) {}

  async send(
    channel: NotificationChannel,
    notification: Notification,
    template: BuildEmailResponse | BuildInAppResponse | BuildWhatsappResponse,
  ) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.emailGateway.send(notification, template as BuildEmailResponse);
      case NotificationChannel.WHATSAPP:
        return await this.whatsappGateway.send(notification, template);
      case NotificationChannel.IN_APP:
        return await this.inAppService.send(notification, template as BuildInAppResponse);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }
}
