import type { InAppNotificationAction } from '../../types/in-app-notification-action.type';

export interface BuildInAppResponse {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  action?: InAppNotificationAction;
}
