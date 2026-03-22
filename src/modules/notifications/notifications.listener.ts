import { OnEvent } from '@nestjs/event-emitter';
import { NotificationProcessorService } from './application/services/notification-processor.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsListener {
  constructor(private readonly processor: NotificationProcessorService) {}

  @OnEvent('notification.process', { async: true })
  async handle(notificationId: string) {
    await this.processor.processNotification(notificationId);
  }
}
