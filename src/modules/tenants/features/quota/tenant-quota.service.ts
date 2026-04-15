import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { TenantQuotaRepository } from './tenant-quota.repository';
import { TenantQuotaCreateInput } from './interfaces/tenant-quota.interface';
import { getMonth, getYear } from 'date-fns';

@Injectable()
export class TenantQuotaService {
  constructor(private readonly tenantQuotaRepository: TenantQuotaRepository) {}

  create(tenantId: string, data: TenantQuotaCreateInput, tx: TransactionClient) {
    const periodMonth = getMonth(new Date()) + 1;
    const periodYear = getYear(new Date());
    const lastResetAt = new Date();

    return this.tenantQuotaRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        periodMonth,
        periodYear,
        lastResetAt,
        professionalCount: data.professionalCount ?? 0,
        appointmentLimit: data.appointmentLimit,
        professionalLimit: data.professionalLimit,
        emailLimit: data.emailLimit,
        whatsappLimit: data.whatsappLimit,
      },
      tx,
    );
  }

  updateLimits(tenantId: string, data: TenantQuotaCreateInput, tx: TransactionClient) {
    return this.tenantQuotaRepository.updateLimits(
      tenantId,
      {
        appointmentLimit: data.appointmentLimit,
        professionalLimit: data.professionalLimit,
        emailLimit: data.emailLimit,
        whatsappLimit: data.whatsappLimit,
      },
      tx,
    );
  }

  async getProfessionalsSnapshot(tenantId: string) {
    const snapshot = await this.tenantQuotaRepository.getProfessionalsSnapshot(tenantId);
    if (!snapshot) {
      throw new Error('No se encontró el límite de profesionales');
    }
    return snapshot;
  }

  async incrementAppointmentsCount(tenantId: string) {
    return this.tenantQuotaRepository.incrementAppointmentsCount(tenantId);
  }

  async findByTenantId(tenantId: string) {
    return this.tenantQuotaRepository.findByTenantId(tenantId);
  }

  async incrementEmailCount(tenantId: string) {
    return this.tenantQuotaRepository.incrementEmailCount(tenantId);
  }

  async incrementWhatsappCount(tenantId: string) {
    return this.tenantQuotaRepository.incrementWhatsappCount(tenantId);
  }
}
