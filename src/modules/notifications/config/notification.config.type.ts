import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';

export type RetryConfig = {
  retryable: boolean;
  maxRetries: number;
};

export type ChannelConfig = {
  channel: NotificationChannel;
  fallback?: NotificationChannel[];
};

export type ChannelsByRecipient = Partial<Record<RecipientType, ChannelConfig[]>>;

export interface NotificationTypeConfig {
  retry: RetryConfig;
  channels: ChannelsByRecipient;
}

export type NotificationConfigMap = Record<string, NotificationTypeConfig>;
