import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import {
  TenantWorkingHoursCreateInput,
  TenantWorkingHoursCreateManyArgs,
  TenantWorkingHoursUpdateInput,
} from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class TenantWorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByTenant(tenantId: string) {
    return this.db().tenantWorkingHours.findMany({
      where: {
        tenantId,
      },
    });
  }

  findById(workingHourId: string, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.findUnique({
      where: { id: workingHourId },
    });
  }

  findByTenantAndDay(tenantId: string, dayOfWeek: number, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.findMany({
      where: {
        tenantId,
        dayOfWeek,
      },
    });
  }

  createMany(data: TenantWorkingHoursCreateManyArgs, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.createMany(data);
  }

  deleteMany(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.deleteMany({ where: { tenantId } });
  }

  update(id: string, data: TenantWorkingHoursUpdateInput, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.update({
      where: { id },
      data,
    });
  }

  delete(id: string, tx?: TransactionClient) {
    return this.db(tx).tenantWorkingHours.delete({
      where: { id },
    });
  }
}
