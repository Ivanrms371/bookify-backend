import { Injectable } from '@nestjs/common';
import { getDate, getDay } from 'date-fns';
import { BaseRepository } from 'src/common/database/base.repository';
import { ScheduleExceptionCreateInput, ScheduleExceptionUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ScheduleExceptionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findManyByEmployeeandTenant(employeeId: string, tenantId: string) {
    return this.prisma.scheduleException.findMany({
      where: {
        employeeId,
        tenantId,
      },
    });
  }

  async findByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date, excludeId?: string) {
    return this.prisma.scheduleException.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        employeeId,
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
  }

  async findByEmployeeAndDate(employeeId: string, date: Date) {
    return this.prisma.scheduleException.findMany({
      where: {
        employeeId,
        startDate: { lte: date },
        endDate: { gte: date },
        daysOfWeek: { has: getDay(date) },
      },
      select: {
        daysOfWeek: true,
        isClosed: true,
        blocks: {
          select: {
            opensAt: true,
            closesAt: true,
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
