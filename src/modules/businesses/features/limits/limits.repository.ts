import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { BusinessLimitsCreateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessLimitsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: BusinessLimitsCreateInput, tx?: TransactionClient) {
    return this.db(tx).businessLimits.create({
      data,
    });
  }

  getProfessionalsSnapshot(businessId: string) {
    return this.db().businessLimits.findUnique({
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
    return this.db().businessLimits.update({
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
    return this.db().businessLimits.findUnique({
      where: {
        businessId,
      },
    });
  }
}
