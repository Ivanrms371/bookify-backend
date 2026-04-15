export interface InAppNotificationCreatedEvent {
  userId: string;
  tenantId: string;
  title: string;
  message: string;
  actionUrl: string;
  type: string;
  readAt: Date | null;
  createdAt: Date;
}
