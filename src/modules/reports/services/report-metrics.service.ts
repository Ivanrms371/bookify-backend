import { formatInTimeZone } from 'date-fns-tz';
import { Injectable } from '@nestjs/common';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { ReportMetricsRepository } from '../repositories/report-metrics.repository';
import { appointmentsDailyTrend, dashboardTrend } from '../utils/report-comparison';
import type { DashboardChartEntry, DashboardStats } from '../types/dashboard.types';
import type { ReportScope, ReportOverviewData } from '../types/reports.types';

@Injectable()
export class ReportMetricsService {
  constructor(private readonly repository: ReportMetricsRepository) {}

  async getReportsMetrics(scope: ReportScope): Promise<ReportOverviewData> {
    return this.repository.findReportAggregates(scope);
  }

  async getDashboardMetrics(tenantId: string, now: Date) {
    const today = startOfDay(now);
    // ── Date ranges ───────────────────────────────────────────────────────
    const last30Start = subDays(today, 29); // last 30 calendar days incl. today
    const last30End = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const [dailyStats, lifetimeStats] = await Promise.all([
      this.repository.findDailyStatsByDateRange(tenantId, previousMonthStart, last30End),
      this.repository.findLifetimeStats(tenantId),
    ]);

    // ── Chart: map all 30-day rows ────────────────────────────────────────
    const chart: DashboardChartEntry[] = dailyStats.filter((row) => row.date >= last30Start).map((row) => ({
      date: formatInTimeZone(row.date, 'UTC', 'yyyy-MM-dd'),
      revenue: Number(row.revenue),
      appointments: row.appointments,
      confirmed: row.confirmed,
      cancelled: row.cancelled,
      completed: row.completed,
      noShow: row.noShow,
      newCustomers: row.newCustomers,
    }));

    // Aggregate complete calendar-month ranges independently of the chart window.
    const monthStart_ms = monthStart.getTime();
    const monthEnd_ms = monthEnd.getTime();

    const monthRows = dailyStats.filter((row) => {
      const d = row.date.getTime();
      return d >= monthStart_ms && d <= monthEnd_ms;
    });

    const revenueCurrentMonth = monthRows.reduce((acc, r) => acc + Number(r.revenue), 0);
    const previousMonthRows = dailyStats.filter((row) => row.date >= previousMonthStart && row.date <= previousMonthEnd);
    const revenuePreviousMonth = previousMonthRows.reduce((total, row) => total + Number(row.revenue), 0);
    const newCustomersCurrentMonth = monthRows.reduce((total, row) => total + row.newCustomers, 0);
    const newCustomersPreviousMonth = previousMonthRows.reduce((total, row) => total + row.newCustomers, 0);

    const todayStr = formatInTimeZone(today, 'UTC', 'yyyy-MM-dd');
    const todayDailyRow = dailyStats.find((r) => formatInTimeZone(r.date, 'UTC', 'yyyy-MM-dd') === todayStr);
    const appointmentsTodayCount = todayDailyRow?.appointments ?? 0;
    const yesterdayStr = formatInTimeZone(subDays(today, 1), 'UTC', 'yyyy-MM-dd');
    const appointmentsYesterdayCount = dailyStats.find((row) => formatInTimeZone(row.date, 'UTC', 'yyyy-MM-dd') === yesterdayStr)?.appointments;

    const stats: DashboardStats = {
      revenue: { current: revenueCurrentMonth, trend: dashboardTrend(revenueCurrentMonth, revenuePreviousMonth) },
      appointmentsToday: { current: appointmentsTodayCount, trend: appointmentsDailyTrend(appointmentsTodayCount, appointmentsYesterdayCount) },
      newCustomers: { current: newCustomersCurrentMonth, trend: dashboardTrend(newCustomersCurrentMonth, newCustomersPreviousMonth) },
      totalCustomers: { current: lifetimeStats?.totalCustomers ?? 0 },
    };

    return { chart, stats };
  }
}
