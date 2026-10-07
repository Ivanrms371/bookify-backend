import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns appointments between startDate and endDate (inclusive, day-boundary aware),
   * including professional and service relations.
   */
  async findAppointmentsByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        startsAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        customerName: true,
        manageToken: true,
        durationMinutes: true,
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            colorTheme: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });
  }
}
