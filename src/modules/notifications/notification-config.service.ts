import { Injectable } from '@nestjs/common';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationConfig } from './config/notification.config';
import { RetryConfig } from './config/notification.config.type';

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

  getRetryPolicy(type: string, recipientType: RecipientType, channel: NotificationChannel): RetryConfig {
    const eventConfig = this.getConfig(type);
    const channelConfig = this.getChannelConfig(type, recipientType, channel);

    return {
      retryable: channelConfig?.retry?.retryable ?? eventConfig.retry.retryable,
      maxRetries: channelConfig?.retry?.maxRetries ?? eventConfig.retry.maxRetries,
      backoffDelays: channelConfig?.retry?.backoffDelays ?? eventConfig.retry.backoffDelays ?? [60_000, 300_000, 900_000],
    };
  }
}
