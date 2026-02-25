import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationProcessorService } from '../application/services/notification-processor.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationScheduler {
  constructor(private readonly processor: NotificationProcessorService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  handle() {
    this.processor.processAll();
  }
}
