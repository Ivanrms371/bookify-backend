import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantQuotaCreateInput } from './interfaces/tenant-quota.interface';

@Injectable()
export class TenantQuotaRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: Prisma.TenantQuotaCreateInput, tx?: TransactionClient) {
    return this.db(tx).tenantQuota.create({
      data,
    });
  }

  updateLimits(tenantId: string, data: TenantQuotaCreateInput, tx?: TransactionClient) {
    return this.db(tx).tenantQuota.update({
      where: { tenantId },
      data: {
        appointmentLimit: data.appointmentLimit,
        professionalLimit: data.professionalLimit,
        whatsappLimit: data.whatsappLimit,
        emailLimit: data.emailLimit,
      },
    });
  }

  getProfessionalsSnapshot(tenantId: string) {
    return this.db().tenantQuota.findUnique({
      where: {
        tenantId,
      },
      select: {
        professionalCount: true,
        professionalLimit: true,
      },
    });
  }

  incrementAppointmentsCount(tenantId: string) {
    return this.db().tenantQuota.update({
      where: {
        tenantId,
      },
      data: {
        appointmentCount: {
          increment: 1,
        },
      },
    });
  }

  incrementEmailCount(tenantId: string) {
    return this.db().tenantQuota.update({
      where: {
        tenantId,
      },
      data: {
        emailCount: {
          increment: 1,
        },
      },
    });
  }

  incrementWhatsappCount(tenantId: string) {
    return this.db().tenantQuota.update({
      where: {
        tenantId,
      },
      data: {
        whatsappCount: {
          increment: 1,
        },
      },
    });
  }

  async findByTenantId(tenantId: string) {
    return this.db().tenantQuota.findUnique({
      where: {
        tenantId,
      },
    });
  }
}
