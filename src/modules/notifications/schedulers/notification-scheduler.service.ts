import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationProcessorService } from '../application/services/notification-processor.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);
  constructor(private readonly processor: NotificationProcessorService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  handle() {
    this.logger.log('Processing notifications');
    this.processor.processAll();
  }
}
