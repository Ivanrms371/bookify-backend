import { NotificationChannel, Notification } from 'src/generated/prisma/client';

export type NotificationProcessorInput = {
  notification: Notification;
  channel: NotificationChannel;
  retryCount: number;
  id: string;
};
