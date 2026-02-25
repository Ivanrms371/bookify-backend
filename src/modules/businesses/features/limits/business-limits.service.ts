import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BusinessLimitsRepository } from './business-limits.repository';
import { BusinessLimitsCreateInput } from './interfaces/business-limits.interface';
import { getMonth, getYear } from 'date-fns';

@Injectable()
export class BusinessLimitsService {
  constructor(private readonly businessLimitsRepository: BusinessLimitsRepository) {}

  create(businessId: string, data: BusinessLimitsCreateInput, tx: TransactionClient) {
    const periodMonth = getMonth(new Date()) + 1;
    const periodYear = getYear(new Date());
    const lastResetAt = new Date();
    return this.businessLimitsRepository.create(
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
    const snapshot = await this.businessLimitsRepository.getProfessionalsSnapshot(businessId);
    if (!snapshot) {
      throw new Error('No se encontró el límite de profesionales');
    }
    return snapshot;
  }

  async incrementAppointmentsCount(businessId: string) {
    return this.businessLimitsRepository.incrementAppointmentsCount(businessId);
  }

  async findByBusinessId(businessId: string) {
    return this.businessLimitsRepository.findByBusinessId(businessId);
  }
}
