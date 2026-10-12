import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationReconciliationService } from '../application/services/notification-reconciliation.service';

@Injectable()
export class NotificationReconciliationScheduler {
  private running = false;
  private readonly logger = new Logger(NotificationReconciliationScheduler.name);
  constructor(private readonly reconciliation: NotificationReconciliationService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handle() {
    if (this.running) return;
    this.running = true;
    try {
      await this.reconciliation.run();
    } catch {
      this.logger.error('Email reconciliation scan failed; no uncertain deliveries were released');
    } finally {
      this.running = false;
    }
  }
}
