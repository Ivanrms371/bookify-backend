import { Module } from '@nestjs/common';
import { BusinessQuotaService } from './business-quota.service';
import { BusinessQuotaRepository } from './business-quota.repository';

@Module({
  imports: [],
  providers: [BusinessQuotaService, BusinessQuotaRepository],
  exports: [BusinessQuotaService],
})
export class BusinessQuotaModule {}
