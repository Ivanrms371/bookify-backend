import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ProfessionalStatsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Reading Methods ---

  async getStatsForDateRange(professionalId: string, startDate: Date, endDate: Date) {
    return await this.prisma.professionalDailyStats.aggregate({
      where: {
        professionalId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        appointments: true,
        cancelled: true,
        completed: true,
        noShow: true,
        revenue: true,
        newCustomers: true,
      },
    });
  }

  async getStatsForToday(professionalId: string) {
    const today = startOfDay(new Date());
    const row = await this.prisma.professionalDailyStats.findUnique({
      where: { professionalId_date: { professionalId, date: today } },
    });
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.newCustomers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getLifetimeStats(professionalId: string) {
    const row = await this.prisma.professionalLifetimeStats.findUnique({
      where: { professionalId },
    });
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      totalCustomers: row?.totalNewCustomers ?? 0, // In user's schema, it's totalNewCustomers
    };
  }

  async getDailyRevenueForRange(professionalId: string, startDate: Date, endDate: Date) {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const rows = await this.prisma.professionalDailyStats.findMany({
      where: {
        professionalId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { date: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    const { eachDayOfInterval } = await import('date-fns');

    // We recreate simple key without dates util directly
    const formatKey = (d: Date) => d.toISOString().split('T')[0];
    const revenueMap = new Map(rows.map((r) => [formatKey(r.date), Number(r.revenue)]));

    return eachDayOfInterval({ start, end }).map((day) => {
      const key = formatKey(day);
      return { date: key, revenue: revenueMap.get(key) ?? 0 };
    });
  }
}
