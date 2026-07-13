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

  async getAvailabilityContextData(employeeId: string, date: Date, tx?: TransactionClient) {
    const dayOfWeek = getDay(date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.db(tx).employee.findUnique({
      where: { id: employeeId },
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
            startDate: { lte: end },
            endDate: { gte: start },
          },
          take: 1,
          select: {
            isClosed: true,
            blocks: {
              select: {
                opensAt: true,
                closesAt: true,
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
                employeeId: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });
  }

  getAvailabilityConfig(employeeId: string, tx?: TransactionClient) {
    return this.db(tx).employee.findUnique({
      where: { id: employeeId },
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

  async getAppointmentsAndExceptions(employeeId: string, startDate: Date, maxDays: number, tx?: TransactionClient) {
    const start = startOfDay(startDate);
    const end = endOfDay(addDays(startDate, maxDays));

    const appointmentsPromise = this.db(tx).appointment.findMany({
      where: {
        employeeId,
        status: { not: AppointmentStatus.CANCELLED },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: {
        blocks: {
          select: {
            employeeId: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    const exceptionsPromise = this.db(tx).scheduleException.findMany({
      where: {
        employeeId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: {
        isClosed: true,
        daysOfWeek: true,
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

    const [appointments, exceptions] = await Promise.all([appointmentsPromise, exceptionsPromise]);

    return {
      appointments,
      exceptions,
    };
  }

  async getNextAvailableDay(employeeId: string, startDate: Date, maxDays: number, tx?: TransactionClient) {
    const start = startOfDay(startDate);
    const end = endOfDay(addDays(startDate, maxDays));

    return this.db(tx).employee.findUnique({
      where: { id: employeeId },
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
          },
        },

        workingHours: {
          select: {
            opensAt: true,
            closesAt: true,
            dayOfWeek: true,
          },
        },

        exceptions: {
          where: {
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
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });
  }

  async findServiceAssignment(employeeId: string, serviceId: string, tx?: TransactionClient) {
    return this.db(tx).serviceAssignment.findUnique({
      where: {
        employeeId_serviceId: {
          employeeId,
          serviceId,
        },
      },
      select: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
      },
    });
  }
}
