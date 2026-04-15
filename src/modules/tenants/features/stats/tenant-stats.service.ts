import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class TenantStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementDailyAppointments(tenantId: string, date: Date) {
    const day = startOfDay(date);
    await this.prisma.tenantDailyStats.upsert({
      where: { tenantId_date: { tenantId, date: day } },
      update: { appointments: { increment: 1 } },
      create: { tenantId, date: day, appointments: 1 },
    });
  }

  async incrementLifetimeAppointments(tenantId: string) {
    await this.prisma.tenantLifetimeStats.upsert({
      where: { tenantId },
      update: { totalAppointments: { increment: 1 } },
      create: { tenantId, totalAppointments: 1, totalRevenue: 0, totalCustomers: 0 },
    });
  }

  async getStatsForDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.aggregate({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      _sum: {
        appointments: true,
        confirmed: true,
        cancelled: true,
        completed: true,
        noShow: true,
        revenue: true,
        newCustomers: true,
      },
    });
  }

  async getStatsForToday(tenantId: string) {
    const today = startOfDay(new Date());
    const row = await this.prisma.tenantDailyStats.findUnique({
      where: { tenantId_date: { tenantId, date: today } },
    });
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.newCustomers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getLifetimeStats(tenantId: string) {
    const row = await this.prisma.tenantLifetimeStats.findUnique({
      where: { tenantId },
    });
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      totalCustomers: row?.totalCustomers ?? 0,
    };
  }

  async getDailyRevenueForRange(tenantId: string, startDate: Date, endDate: Date) {
    const rows = await this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: { date: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    const revenueMap = new Map(rows.map((r) => [format(r.date, 'yyyy-MM-dd'), Number(r.revenue)]));

    return eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) }).map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return { date: key, revenue: revenueMap.get(key) ?? 0 };
    });
  }
}
