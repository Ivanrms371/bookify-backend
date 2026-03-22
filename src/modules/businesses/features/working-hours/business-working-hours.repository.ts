import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BusinessWorkingHoursCreateInput, BusinessWorkingHoursUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessWorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByBusiness(businessId: string) {
    return this.db().businessWorkingHours.findMany({
      where: {
        businessId,
      },
    });
  }

  findById(workingHourId: string, tx?: TransactionClient) {
    return this.db(tx).businessWorkingHours.findUnique({
      where: { id: workingHourId },
    });
  }

  findByBusinessAndDay(businessId: string, dayOfWeek: number, tx?: TransactionClient) {
    return this.db(tx).businessWorkingHours.findMany({
      where: {
        businessId,
        dayOfWeek,
      },
    });
  }

  create(data: BusinessWorkingHoursCreateInput, tx?: TransactionClient) {
    return this.db(tx).businessWorkingHours.create({
      data,
    });
  }

  update(id: string, data: BusinessWorkingHoursUpdateInput, tx?: TransactionClient) {
    return this.db(tx).businessWorkingHours.update({
      where: { id },
      data,
    });
  }

  delete(id: string, tx?: TransactionClient) {
    return this.db(tx).businessWorkingHours.delete({
      where: { id },
    });
  }
}
