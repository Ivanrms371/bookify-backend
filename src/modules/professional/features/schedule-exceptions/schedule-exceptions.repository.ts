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

  async findMany(professionalId: string, tenantId: string) {
    return this.prisma.scheduleException.findMany({
      where: {
        professionalId,
        tenantId,
      },
    });
  }

  async findByDateRange(professionalId: string, startDate: Date, endDate: Date, excludeId?: string) {
    return this.prisma.scheduleException.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        professionalId,
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
  }

  async findByDate(professionalId: string, date: Date) {
    return this.prisma.scheduleException.findMany({
      where: {
        professionalId,
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
