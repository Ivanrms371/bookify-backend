import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { BusinessQuotaCreateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessQuotaRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: BusinessQuotaCreateInput, tx?: TransactionClient) {
    return this.db(tx).businessQuota.create({
      data,
    });
  }

  getProfessionalsSnapshot(businessId: string) {
    return this.db().businessQuota.findUnique({
      where: {
        businessId,
      },
      select: {
        professionalCount: true,
        professionalLimit: true,
      },
    });
  }

  incrementAppointmentsCount(businessId: string) {
    return this.db().businessQuota.update({
      where: {
        businessId,
      },
      data: {
        appointmentCount: {
          increment: 1,
        },
      },
    });
  }

  async findByBusinessId(businessId: string) {
    return this.db().businessQuota.findUnique({
      where: {
        businessId,
      },
    });
  }
}
