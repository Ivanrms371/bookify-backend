import { Logger } from '@nestjs/common';
import { PlatformStatsService } from './platform-stats.service';
import { Cron } from '@nestjs/schedule';

export class PlatformStatsScheduler {
  private readonly logger = new Logger(PlatformStatsScheduler.name);

  constructor(private readonly platformStatsService: PlatformStatsService) {}

  @Cron('0 0 * * *')
  async handle() {
    this.logger.log('Creating PlatformStats ');
    await this.platformStatsService.createDailyStats();
  }
}
