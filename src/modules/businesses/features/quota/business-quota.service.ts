import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BusinessQuotaRepository } from './business-quota.repository';
import { BusinessQuotaCreateInput } from './interfaces/business-quota.interface';
import { getMonth, getYear } from 'date-fns';

@Injectable()
export class BusinessQuotaService {
  constructor(private readonly businessQuotaRepository: BusinessQuotaRepository) {}

  create(businessId: string, data: BusinessQuotaCreateInput, tx: TransactionClient) {
    const periodMonth = getMonth(new Date()) + 1;
    const periodYear = getYear(new Date());
    const lastResetAt = new Date();
    return this.businessQuotaRepository.create(
      {
        business: { connect: { id: businessId } },
        ...data,
        periodMonth,
        periodYear,
        lastResetAt,
      },
      tx,
    );
  }

  async getProfessionalsSnapshot(businessId: string) {
    const snapshot = await this.businessQuotaRepository.getProfessionalsSnapshot(businessId);
    if (!snapshot) {
      throw new Error('No se encontró el límite de profesionales');
    }
    return snapshot;
  }

  async incrementAppointmentsCount(businessId: string) {
    return this.businessQuotaRepository.incrementAppointmentsCount(businessId);
  }

  async findByBusinessId(businessId: string) {
    return this.businessQuotaRepository.findByBusinessId(businessId);
  }
}
