import { Module } from '@nestjs/common';
import { CustomerStatsService } from './customer-stats.service';
import { StaffStatsService } from './staff-stats.service';
import { TenantStatsService } from './tenant-stats.service';

@Module({
  providers: [CustomerStatsService, StaffStatsService, TenantStatsService],
  exports: [CustomerStatsService, StaffStatsService, TenantStatsService],
})
export class StatsModule {}
