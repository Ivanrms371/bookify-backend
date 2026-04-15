import { Module } from '@nestjs/common';
import { StaffStatsService } from './staff-stats.service';

@Module({
  providers: [StaffStatsService],
  exports: [StaffStatsService],
})
export class StaffStatsModule {}
