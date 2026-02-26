import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { endOfDay, startOfDay, getDay } from 'date-fns';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AppointmentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class AvailabilityQuery extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAvailabilityData(staffId: string, date: Date, tx?: TransactionClient) {
    const dayOfWeek = getDay(date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.db(tx).staff.findUnique({
      where: { id: staffId },
      select: {
        slotIntervalMinutes: true,
        minAdvancedMinutes: true,

        business: {
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
          },
        },

        workingHours: {
          where: { dayOfWeek },
          select: {
            startMinutes: true,
            endMinutes: true,
          },
        },

        exceptions: {
          where: {
            startDate: { lte: end },
            endDate: { gte: start },
          },
          take: 1,
          select: {
            isClosed: true,
            blocks: {
              select: {
                startMinutes: true,
                endMinutes: true,
              },
            },
          },
        },

        appointments: {
          where: {
            status: { not: AppointmentStatus.CANCELLED },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          select: {
            blocks: {
              select: {
                staffId: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });
  }

  async findServiceAssignment(staffId: string, serviceId: string, tx?: TransactionClient) {
    return this.db(tx).serviceAssignment.findUnique({
      where: {
        staffId_serviceId: {
          staffId,
          serviceId,
        },
      },
      select: {
        service: {
          select: {
            durationMinutes: true,
            initialActiveMinutes: true,
            passiveTimeMinutes: true,
            finalActiveMinutes: true,
          },
        },
      },
    });
  }
}
