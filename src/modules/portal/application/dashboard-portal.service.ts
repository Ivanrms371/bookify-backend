import { Injectable } from '@nestjs/common';
import { endOfMonth, startOfMonth, subDays, subMonths } from 'date-fns';
import { TenantStatsService } from 'src/modules/tenants/features/stats/tenant-stats.service';
import { TenantUsageService } from 'src/modules/tenants/features/usage/tenant-usage.service';
import { calculateTrend } from '../infrastructure/utils/trend.util';

@Injectable()
export class DashboardPortalService {
  constructor(
    private readonly tenantStatsService: TenantStatsService,
    private readonly tenantUsageService: TenantUsageService,
  ) {}

  async getTenantOverview(tenantId: string) {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    const yesterday = subDays(today, 1);
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = subMonths(today, 1);

    const [chart, lifetime, monthStats, quota, todayStats, yesterdayStats, thisMonthAggregate, lastMonthAggregate] = await Promise.all([
      this.tenantStatsService.getRange(tenantId, thirtyDaysAgo, today, {
        date: true,
        revenue: true,
      }),
      this.tenantStatsService.getSummary(tenantId, { totalCustomers: true }),
      this.tenantStatsService.getRange(tenantId, startMonth, endMonth, { revenue: true, newCustomers: true }),
      this.tenantUsageService.getUsageStatus(tenantId),
      this.tenantStatsService.getStatsForDate(tenantId, today),
      this.tenantStatsService.getStatsForDate(tenantId, yesterday),
      this.tenantStatsService.getAggregateRange(tenantId, startMonth, endMonth),
      this.tenantStatsService.getAggregateRange(tenantId, lastMonthStart, lastMonthEnd),
    ]);

    const revenueThisMonth = Number(thisMonthAggregate?._sum?.revenue ?? 0);
    const revenueLastMonth = Number(lastMonthAggregate?._sum?.revenue ?? 0);
    const newCustomersThisMonth = Number(thisMonthAggregate?._sum?.newCustomers ?? 0);
    const newCustomersLastMonth = Number(lastMonthAggregate?._sum?.newCustomers ?? 0);

    const stats = {
      revenue: {
        current: revenueThisMonth,
        trend: calculateTrend(revenueThisMonth, revenueLastMonth),
      },
      appointmentsToday: {
        current: todayStats.appointments,
        trend: calculateTrend(todayStats.appointments, yesterdayStats.appointments),
      },
      newCustomers: {
        current: newCustomersThisMonth,
        trend: calculateTrend(newCustomersThisMonth, newCustomersLastMonth),
      },
      totalCustomers: {
        current: lifetime?.totalCustomers ?? 0,
      },
    };

    return {
      chart,
      lifetime,
      monthStats,
      quota,
      stats,
    };
  }
}
