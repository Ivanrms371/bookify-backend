import { Module } from '@nestjs/common';
import { BusinessStatsService } from './business-stats.service';

@Module({
  providers: [BusinessStatsService],
  exports: [BusinessStatsService],
})
export class BusinessStatsModule {}
