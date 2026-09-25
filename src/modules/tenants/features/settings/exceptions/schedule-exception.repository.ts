import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ScheduleExceptionCreateInput, ScheduleExceptionUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { scheduleExceptionSelect, type RawScheduleException } from './types/schedule-exception-response.types';

interface FindManyParams {
  startDate?: Date;
  endDate?: Date;
  professionalId?: string;
}

@Injectable()
export class ScheduleExceptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, params?: FindManyParams): Promise<RawScheduleException[]> {
    return this.prisma.scheduleException.findMany({
      where: {
        tenantId,
        ...(params?.endDate && { startDate: { lte: params.endDate } }),
        ...(params?.startDate && { endDate: { gte: params.startDate } }),
        ...(params?.professionalId && {
          professionals: { some: { professionalId: params.professionalId } },
        }),
      },
      orderBy: { startDate: 'asc' },
      select: scheduleExceptionSelect,
    });
  }

  findById(tenantId: string, id: string): Promise<RawScheduleException | null> {
    return this.prisma.scheduleException.findUnique({
      where: { id, tenantId },
      select: scheduleExceptionSelect,
    });
  }

  create(data: ScheduleExceptionCreateInput): Promise<RawScheduleException> {
    return this.prisma.scheduleException.create({
      data,
      select: scheduleExceptionSelect,
    });
  }

  update(tenantId: string, id: string, data: ScheduleExceptionUpdateInput): Promise<RawScheduleException> {
    return this.prisma.scheduleException.update({
      where: { tenantId, id },
      data,
      select: scheduleExceptionSelect,
    });
  }

  delete(tenantId: string, id: string): Promise<{ id: string }> {
    return this.prisma.scheduleException.delete({
      where: { id, tenantId },
      select: { id: true },
    });
  }
}
