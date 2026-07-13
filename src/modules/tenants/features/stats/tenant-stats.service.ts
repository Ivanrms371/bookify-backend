import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { TenantDailyStatsSelect, TenantLifetimeStatsSelect } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantStatsRepository } from './tenant-stats.repository';
import { TenantDailyStatsMapper } from './mappers/tenant-daily-stats.mapper';
import { TenantDailyStat } from './types/tenant-daily-stats.type';
import { TenantLifetimeStat } from 'src/modules/portal/domain/types/tenant-lifetime-stats.type';
import { TenantLifetimeStatsMapper } from 'src/modules/portal/infrastructure/mappers/tenant-lifetime-stats.mapper';

@Injectable()
export class TenantStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantStatsRepository: TenantStatsRepository,
  ) {}

  async getRange(tenantId: string, startDate: Date, endDate: Date, fields: TenantDailyStatsSelect): Promise<Partial<TenantDailyStat>[]> {
    const dailyStats = await this.tenantStatsRepository.getDailyStatsByRange(tenantId, startDate, endDate, fields);
    return TenantDailyStatsMapper.toDomainList(dailyStats, startDate, endDate);
  }

  async getSummary(tenantId: string, fields: TenantLifetimeStatsSelect): Promise<Partial<TenantLifetimeStat>> {
    const lifetimeStats = await this.prisma.tenantLifetimeStats.findUnique({
      where: { id: tenantId },
      select: fields,
    });
    return TenantLifetimeStatsMapper.toDomain(lifetimeStats);
  }

  async getAggregateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.tenantStatsRepository.aggregateStatsByRange(tenantId, startDate, endDate);
  }

  async getStatsForDate(tenantId: string, date: Date) {
    const targetDate = startOfDay(date);
    const row = await this.tenantStatsRepository.getDailyStatsByDate(tenantId, targetDate);
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.newCustomers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getStatsForToday(tenantId: string) {
    return this.getStatsForDate(tenantId, new Date());
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
