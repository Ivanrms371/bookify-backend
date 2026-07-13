import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { TenantUsageRepository } from './tenant-usage.repository';
import { getMonth, getYear } from 'date-fns';
import { TenantQuotaMapper } from './mappers/tenant-usage.mapper';
import { TenantUsageFindInput, TenantUsageStatus, TenantUsageUpsertInput } from './interfaces/tenant-usage.interface';

@Injectable()
export class TenantUsageService {
  constructor(private readonly tenantUsageRepository: TenantUsageRepository) {}

  upsert(tenantId: string, data: TenantUsageUpsertInput, tx: TransactionClient) {
    const periodMonth = getMonth(new Date()) + 1;
    const periodYear = getYear(new Date());
    const where: TenantUsageFindInput = { tenantId, periodMonth, periodYear };
    return this.tenantUsageRepository.upsert(where, data, tx);
  }

  async incrementAppointmentsCount(tenantId: string) {
    const periodMonth = getMonth(new Date());
    const periodYear = getYear(new Date());
    return this.tenantUsageRepository.incrementAppointmentsCount({ tenantId, periodMonth, periodYear });
  }

  async findByTenantId(tenantId: string) {
    const periodMonth = getMonth(new Date());
    const periodYear = getYear(new Date());
    return this.tenantUsageRepository.findByTenantId({ tenantId, periodMonth, periodYear });
  }

  async incrementEmailCount(tenantId: string) {
    const periodMonth = getMonth(new Date());
    const periodYear = getYear(new Date());
    return this.tenantUsageRepository.incrementEmailCount({ tenantId, periodMonth, periodYear });
  }

  async incrementWhatsappCount(tenantId: string) {
    const periodMonth = getMonth(new Date());
    const periodYear = getYear(new Date());
    return this.tenantUsageRepository.incrementWhatsappCount({ tenantId, periodMonth, periodYear });
  }

  async getUsageStatus(tenantId: string): Promise<TenantUsageStatus | null> {
    const periodMonth = getMonth(new Date());
    const periodYear = getYear(new Date());
    const currentUsage = await this.tenantUsageRepository.findByTenantId({ tenantId, periodMonth, periodYear });

    if (!currentUsage) {
      return {
        emails: { count: 0, limit: 0, percentage: 0 },
        whatsapp: { count: 0, limit: 0, percentage: 0 },
        appointments: { count: 0, limit: 0, percentage: 0 },
      };
    }

    return TenantQuotaMapper.toDomain(currentUsage);
  }
}
