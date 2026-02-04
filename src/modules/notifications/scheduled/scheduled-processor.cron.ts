import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledNotificationRepository } from './repositories/scheduled-notification.repository';

@Injectable()
export class ScheduledProcessorCron {
  private readonly logger = new Logger(ScheduledProcessorCron.name);
  private readonly limit = 100;

  constructor(private readonly scheduledRepo: ScheduledNotificationRepository) {}

  @Cron(CronExpression.EVERY_5_MINUTES) // each 5 minutes
  async processScheduledNotifications() {
    const now = new Date();

    const pending = await this.scheduledRepo.findPendingToSend(now, this.limit);

    if (pending.length === 0) return;

    this.logger.log(`Processing ${pending.length} scheduled notifications`);

    for (const notification of pending) {
      try {
        const to = notification.recipientPhone || notification.recipientEmail;

        if (!to) {
          this.logger.warn(`Notification ${notification.id} has no recipient`);
          continue;
        }

        // send notification
        // const result = await this.notificationService.send();

        await this.scheduledRepo.markAsSent(notification.id);

        // this.logger.log(`✅ Sent scheduled notification ${notification.id} via ${result.channel}`);
      } catch (error) {
        if (notification.retryCount < 3) {
          await this.scheduledRepo.incrementRetry(notification.id);
          this.logger.log(
            `🔄 Will retry notification ${notification.id} (attempt ${notification.retryCount + 1}/3)`,
          );
        } else {
          await this.scheduledRepo.markAsFailed(notification.id, error.message);
          this.logger.error(`❌ Failed to send notification ${notification.id} after 3 retries`);
        }
      }
    }
  }

  // Monthly cleanup of old notifications | 2 AM
  @Cron('0 2 1 * *')
  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await this.scheduledRepo.deleteOld(thirtyDaysAgo);

    this.logger.log(`Cleaned up ${deletedCount} old notifications`);
  }
}
