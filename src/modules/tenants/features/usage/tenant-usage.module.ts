import { Module } from '@nestjs/common';
import { TenantUsageService } from './tenant-usage.service';
import { TenantUsageRepository } from './tenant-usage.repository';

@Module({
  providers: [TenantUsageService, TenantUsageRepository],
  exports: [TenantUsageService],
})
export class TenantUsageModule {}
