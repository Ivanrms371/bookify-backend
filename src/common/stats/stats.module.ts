import { Module } from '@nestjs/common';
import { CustomerStatsService } from './customer-stats.service';
import { EmployeeStatsService } from './employee-stats.service';
import { TenantStatsService } from './tenant-stats.service';

@Module({
  providers: [CustomerStatsService, EmployeeStatsService, TenantStatsService],
  exports: [CustomerStatsService, EmployeeStatsService, TenantStatsService],
})
export class StatsModule {}
