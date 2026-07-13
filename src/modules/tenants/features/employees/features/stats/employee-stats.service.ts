import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class EmployeeStatsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Reading Methods ---

  async getStatsForDateRange(employeeId: string, startDate: Date, endDate: Date) {
    return await this.prisma.employeeDailyStats.aggregate({
      where: {
        employeeId,
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

  async getStatsForToday(employeeId: string) {
    const today = startOfDay(new Date());
    const row = await this.prisma.employeeDailyStats.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.newCustomers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getLifetimeStats(employeeId: string) {
    const row = await this.prisma.employeeLifetimeStats.findUnique({
      where: { employeeId },
    });
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      totalCustomers: row?.totalNewCustomers ?? 0, // In user's schema, it's totalNewCustomers
    };
  }

  async getDailyRevenueForRange(employeeId: string, startDate: Date, endDate: Date) {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const rows = await this.prisma.employeeDailyStats.findMany({
      where: {
        employeeId,
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
