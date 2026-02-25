import { Injectable } from '@nestjs/common';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationConfig } from './config/notification.config';

@Injectable()
export class NotificationConfigService {
  getConfig(type: string) {
    return NotificationConfig[type] || NotificationConfig['DEFAULT'];
  }

  getChannels(type: string, recipientType: RecipientType) {
    const config = NotificationConfig[type] ?? NotificationConfig['DEFAULT'];
    return config.channels[recipientType] ?? [];
  }

  getChannelConfig(type: string, recipientType: RecipientType, channel: NotificationChannel) {
    const channels = this.getChannels(type, recipientType);
    return channels.find((c) => c.channel === channel);
  }
}
