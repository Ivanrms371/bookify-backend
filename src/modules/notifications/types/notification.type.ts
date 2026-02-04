import { NotificationType, NotificationChannel } from 'src/generated/prisma/enums';

export interface NotificationPayload {
  userId: string;
  businessId?: string;
  scheduledNotificationId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  contact: NotificationContact;
  content: NotificationContent;
}

export interface NotificationContent {
  template?: string;
  variables?: any;
}

export interface NotificationContact {
  phone?: string;
  email?: string;
}

export interface NotificationResult {
  provider: string;
  providerMessageId?: string;
  error?: string;
  cost?: number;
}
