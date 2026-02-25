import { Injectable } from '@nestjs/common';
import { NotificationChannel, Notification } from 'src/generated/prisma/client';
import { EmailGateway } from './email.gateway';
import { WhatsappGateway } from './whatsapp.gateway';
import { InAppGateway } from './in-app.gateway';
import { ChannelContentMap, EmailContent, InAppContent, WhatsAppContent } from '../../types/template.type';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';

@Injectable()
export class NotificationGatewaysService {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly whatsappGateway: WhatsappGateway,
    private readonly inAppGateway: InAppGateway,
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
        return await this.whatsappGateway.send(notification, template as BuildWhatsappResponse);
      case NotificationChannel.IN_APP:
        return await this.inAppGateway.send(notification, template as BuildInAppResponse);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }
}
