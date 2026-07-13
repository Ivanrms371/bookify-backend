import { Module } from '@nestjs/common';
import { TenantStatsService } from './tenant-stats.service';
import { TenantStatsRepository } from './tenant-stats.repository';

@Module({
  providers: [TenantStatsService, TenantStatsRepository],
  exports: [TenantStatsService],
})
export class TenantStatsModule {}
