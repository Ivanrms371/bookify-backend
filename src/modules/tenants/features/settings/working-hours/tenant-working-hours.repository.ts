import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TenantWorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(tenantId: string) {
    return this.db().tenantWorkingHours.findMany({
      where: { tenantId },
      select: {
        dayOfWeek: true,
        opensAt: true,
        closesAt: true,
      },
    });
  }

  async replaceWorkingHours(
    tenantId: string,
    data: { tenantId: string; dayOfWeek: number; opensAt: number; closesAt: number }[],
    tx?: TransactionClient,
  ): Promise<void> {
    await this.db(tx).tenantWorkingHours.deleteMany({ where: { tenantId } });
    if (data.length > 0) {
      await this.db(tx).tenantWorkingHours.createMany({ data });
    }
  }
}
