import { Module } from '@nestjs/common';
import { TenantQuotaService } from './tenant-quota.service';
import { TenantQuotaRepository } from './tenant-quota.repository';

@Module({
  imports: [],
  providers: [TenantQuotaService, TenantQuotaRepository],
  exports: [TenantQuotaService],
})
export class TenantQuotaModule {}
