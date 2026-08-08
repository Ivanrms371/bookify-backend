import { Module } from '@nestjs/common';
import { CustomerStatsService } from './customer-stats.service';
import { ProfessionalStatsService } from './professional-stats.service';
import { TenantStatsService } from './tenant-stats.service';

@Module({
  providers: [CustomerStatsService, ProfessionalStatsService, TenantStatsService],
  exports: [CustomerStatsService, ProfessionalStatsService, TenantStatsService],
})
export class StatsModule {}
