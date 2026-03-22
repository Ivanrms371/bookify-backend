import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementDailyAppointments(businessId: string, date: Date) {
    const day = startOfDay(date);
    await this.prisma.businessDailyStats.upsert({
      where: { businessId_date: { businessId, date: day } },
      update: { appointments: { increment: 1 } },
      create: { businessId, date: day, appointments: 1 },
    });
  }

  async incrementLifetimeAppointments(businessId: string) {
    await this.prisma.businessLifetimeStats.upsert({
      where: { businessId },
      update: { totalAppointments: { increment: 1 } },
      create: { businessId, totalAppointments: 1, totalRevenue: 0, totalCustomers: 0 },
    });
  }

  async getStatsForDateRange(businessId: string, startDate: Date, endDate: Date) {
    return this.prisma.businessDailyStats.aggregate({
      where: {
        businessId,
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
        customers: true,
      },
    });
  }

  async getStatsForToday(businessId: string) {
    const today = startOfDay(new Date());
    const row = await this.prisma.businessDailyStats.findUnique({
      where: { businessId_date: { businessId, date: today } },
    });
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.customers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getLifetimeStats(businessId: string) {
    const row = await this.prisma.businessLifetimeStats.findUnique({
      where: { businessId },
    });
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      totalCustomers: row?.totalCustomers ?? 0,
    };
  }

  async getDailyRevenueForRange(businessId: string, startDate: Date, endDate: Date) {
    const rows = await this.prisma.businessDailyStats.findMany({
      where: {
        businessId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: { date: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    const revenueMap = new Map(
      rows.map((r) => [format(r.date, 'yyyy-MM-dd'), Number(r.revenue)]),
    );

    return eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) }).map(
      (day) => {
        const key = format(day, 'yyyy-MM-dd');
        return { date: key, revenue: revenueMap.get(key) ?? 0 };
      },
    );
  }
}
