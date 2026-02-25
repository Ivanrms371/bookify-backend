import { Injectable } from '@nestjs/common';
import { getDate, getDay } from 'date-fns';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  ScheduleExceptionCreateInput,
  ScheduleExceptionUpdateInput,
} from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ScheduleExceptionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findManyByStaffandBusiness(staffId: string, businessId: string) {
    return this.prisma.scheduleException.findMany({
      where: {
        staffId,
        businessId,
      },
    });
  }

  async findByStaffAndDateRange(
    staffId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ) {
    return this.prisma.scheduleException.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        staffId,
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
  }

  async findByStaffAndDate(staffId: string, date: Date) {
    return this.prisma.scheduleException.findMany({
      where: {
        staffId,
        startDate: { lte: date },
        endDate: { gte: date },
        daysOfWeek: { has: getDay(date) },
      },
      select: {
        daysOfWeek: true,
        isClosed: true,
        blocks: {
          select: {
            startMinutes: true,
            endMinutes: true,
          },
        },
      },
    });
  }

  async create(data: ScheduleExceptionCreateInput) {
    return this.prisma.scheduleException.create({
      data,
    });
  }

  async update(id: string, data: ScheduleExceptionUpdateInput) {
    return this.prisma.scheduleException.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.scheduleException.delete({
      where: { id },
    });
  }
}
