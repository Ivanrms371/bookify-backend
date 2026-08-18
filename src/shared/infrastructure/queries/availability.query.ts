import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { endOfDay, startOfDay, getDay, addDays } from 'date-fns';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AppointmentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class AvailabilityQuery extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAvailabilityContextData(professionalId: string, date: Date, tx?: TransactionClient) {
    const dayOfWeek = getDay(date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.db(tx).professional.findUniqueOrThrow({
      where: { id: professionalId },
      select: {
        slotIntervalMinutes: true,
        minAdvancedMinutes: true,

        tenant: {
          select: {
            settings: {
              select: {
                allowPassiveTimeBooking: true,
                bufferTimeMinutes: true,
                maxAdvancedDays: true,
                minAdvancedMinutes: true,
                slotIntervalMinutes: true,
              },
            },
            tenantWorkingHours: {
              where: { dayOfWeek },
              select: {
                opensAt: true,
                closesAt: true,
                dayOfWeek: true,
              },
            },
          },
        },

        workingHours: {
          where: { dayOfWeek },
          select: {
            opensAt: true,
            closesAt: true,
          },
        },

        exceptions: {
          where: {
            scheduleException: {
              startDate: { lt: end },
              endDate: { gt: start },
            },
          },
        },

        appointments: {
          where: {
            status: { not: AppointmentStatus.CANCELLED },
            startsAt: { lt: end },
            endsAt: { gt: start },
          },
          select: {
            blocks: {
              select: {
                startsAt: true,
                endsAt: true,
              },
            },
          },
        },
      },
    });
  }

  getAvailabilityConfig(tenantId: string, professionalId: string, tx?: TransactionClient) {
    return this.db(tx).professional.findUnique({
      where: {
        id: professionalId,
        tenantId,
      },
      select: {
        slotIntervalMinutes: true,
        minAdvancedMinutes: true,
        tenant: {
          select: {
            tenantWorkingHours: {
              select: {
                opensAt: true,
                closesAt: true,
                dayOfWeek: true,
              },
            },
            settings: {
              select: {
                slotIntervalMinutes: true,
                minAdvancedMinutes: true,
                maxAdvancedDays: true,
                timeZone: true,
              },
            },
          },
        },

        workingHours: {
          select: {
            opensAt: true,
            closesAt: true,
            dayOfWeek: true,
          },
        },
      },
    });
  }

  async getAppointmentsInRange(professionalId: string, start: Date, end: Date) {
    return await this.prisma.appointment.findMany({
      where: {
        professionalId,
        status: { not: AppointmentStatus.CANCELLED },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
      select: {
        blocks: {
          select: {
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });
  }

  async getExceptionsInRange(professionalId: string, start: Date, end: Date) {
    return await this.prisma.scheduleException.findMany({
      where: {
        professionals: { some: { professionalId } },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: {
        isClosed: true,
        blocks: {
          select: {
            opensAt: true,
            closesAt: true,
          },
        },
        startDate: true,
        endDate: true,
      },
    });
  }
}
