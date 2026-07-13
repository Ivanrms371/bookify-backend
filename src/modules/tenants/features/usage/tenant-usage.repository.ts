import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantUsageFindInput, TenantUsageUpsertInput } from './interfaces/tenant-usage.interface';

@Injectable()
export class TenantUsageRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  upsert(where: TenantUsageFindInput, data: TenantUsageUpsertInput, tx?: TransactionClient) {
    const { tenantId, periodMonth, periodYear } = where;
    return this.db(tx).tenantUsage.upsert({
      where: {
        tenantId_periodMonth_periodYear: where,
      },
      update: {
        appointmentLimit: data.appointmentLimit,
        whatsappLimit: data.whatsappLimit,
        emailLimit: data.emailLimit,
      },
      create: {
        tenant: { connect: { id: where.tenantId } },
        lastResetAt: new Date(),
        periodMonth,
        periodYear,
        appointmentLimit: data.appointmentLimit,
        whatsappLimit: data.whatsappLimit,
        emailLimit: data.emailLimit,
      },
    });
  }

  incrementAppointmentsCount(where: TenantUsageFindInput) {
    return this.db().tenantUsage.update({
      where: {
        tenantId_periodMonth_periodYear: where,
      },
      data: {
        appointmentCount: {
          increment: 1,
        },
      },
    });
  }

  incrementEmailCount(where: TenantUsageFindInput) {
    return this.db().tenantUsage.update({
      where: {
        tenantId_periodMonth_periodYear: where,
      },
      data: {
        emailCount: {
          increment: 1,
        },
      },
    });
  }

  incrementWhatsappCount(where: TenantUsageFindInput) {
    return this.db().tenantUsage.update({
      where: {
        tenantId_periodMonth_periodYear: where,
      },
      data: {
        whatsappCount: {
          increment: 1,
        },
      },
    });
  }

  async findByTenantId(where: TenantUsageFindInput) {
    return this.db().tenantUsage.findUnique({
      where: {
        tenantId_periodMonth_periodYear: where,
      },
    });
  }
}
