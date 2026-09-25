import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationProcessorService } from '../application/services/notification-processor.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);
  private isProcessing = false;
  constructor(private readonly processor: NotificationProcessorService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handle() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.processor.processBatch();
    } catch (error) {
      this.logger.error('Error executing notification batch', error instanceof Error ? error.stack : error);
    } finally {
      this.isProcessing = false;
    }
  }
}
