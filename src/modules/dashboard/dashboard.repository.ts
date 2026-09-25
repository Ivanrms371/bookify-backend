import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns tenant_daily_stats rows between startDate and endDate (inclusive),
   * ordered by date ascending. Both boundaries are treated as calendar-day boundaries.
   */
  async findDailyStatsByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Returns the single tenant_lifetime_stats row for the given tenant.
   */
  async findLifetimeStats(tenantId: string) {
    return this.prisma.tenantLifetimeStats.findUnique({
      where: { tenantId },
    });
  }

  /**
   * Returns appointments between startDate and endDate (inclusive, day-boundary aware),
   * including professional and service relations.
   */
  async findAppointmentsByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
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
