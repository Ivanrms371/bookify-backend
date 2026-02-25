import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { WorkingHoursCreateInput, WorkingHoursUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class WorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByStaff(staffId: string) {
    return this.db().workingHours.findMany({
      where: {
        staffId,
      },
    });
  }

  findById(workingHourId: string, tx?: TransactionClient) {
    return this.db(tx).workingHours.findUnique({
      where: { id: workingHourId },
    });
  }

  findByStaffAndDay(staffId: string, dayOfWeek: number, tx?: TransactionClient) {
    return this.db(tx).workingHours.findMany({
      where: {
        staffId,
        dayOfWeek,
      },
    });
  }

  findStaffWorkingHoursForSlots(staffId: string, dayOfWeek: number) {
    return this.db().workingHours.findMany({
      where: {
        staffId,
        dayOfWeek,
      },
      select: {
        startMinutes: true,
        endMinutes: true,
      },
    });
  }

  create(data: WorkingHoursCreateInput, tx?: TransactionClient) {
    return this.db(tx).workingHours.create({
      data,
    });
  }

  update(id: string, data: WorkingHoursUpdateInput, tx?: TransactionClient) {
    return this.db(tx).workingHours.update({
      where: { id },
      data,
    });
  }

  delete(id: string, tx?: TransactionClient) {
    return this.db(tx).workingHours.delete({
      where: { id },
    });
  }
}
