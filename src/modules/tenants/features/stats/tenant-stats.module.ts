import { Module } from '@nestjs/common';
import { TenantStatsService } from './tenant-stats.service';

@Module({
  providers: [TenantStatsService],
  exports: [TenantStatsService],
})
export class TenantStatsModule {}
