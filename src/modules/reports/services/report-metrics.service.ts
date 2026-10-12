import { formatInTimeZone } from 'date-fns-tz';
import { Injectable } from '@nestjs/common';
import { statsDate, statsDay } from '../../appointments/stats/appointment-stats-projection';
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
    const settings = await this.repository.findSettings(tenantId);
    const timeZone = settings?.timeZone ?? 'America/Montevideo';
    const today = statsDate(statsDay(now, timeZone));
    const last30Start = new Date(today);
    last30Start.setUTCDate(last30Start.getUTCDate() - 29);
    const last30End = new Date(today.getTime() + 86400000 - 1);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1) - 1);
    const previousMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const previousMonthEnd = new Date(monthStart.getTime() - 1);

    const [dailyStats, registeredCustomerCount] = await Promise.all([
      this.repository.findDailyStatsByDateRange(tenantId, previousMonthStart, last30End),
      this.repository.findRegisteredCustomerCount(tenantId),
    ]);

    // Include every business calendar day, even when no projection row exists.
    const rowsByDay = new Map(dailyStats.map((row) => [formatInTimeZone(row.date, 'UTC', 'yyyy-MM-dd'), row]));
    const chart: DashboardChartEntry[] = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(last30Start);
      day.setUTCDate(day.getUTCDate() + index);
      const date = formatInTimeZone(day, 'UTC', 'yyyy-MM-dd');
      const row = rowsByDay.get(date);
      return {
        date,
        revenue: Number(row?.revenue ?? 0),
        appointments: row?.appointments ?? 0,
        confirmed: row?.confirmed ?? 0,
        cancelled: row?.cancelled ?? 0,
        completed: row?.completed ?? 0,
        noShow: row?.noShow ?? 0,
        newCustomers: row?.newCustomers ?? 0,
      };
    });

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
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    const appointmentsYesterdayCount = dailyStats.find(
      (row) => formatInTimeZone(row.date, 'UTC', 'yyyy-MM-dd') === yesterdayStr,
    )?.appointments;

    const stats: DashboardStats = {
      revenue: { current: revenueCurrentMonth, trend: dashboardTrend(revenueCurrentMonth, revenuePreviousMonth) },
      appointmentsToday: {
        current: appointmentsTodayCount,
        trend: appointmentsDailyTrend(appointmentsTodayCount, appointmentsYesterdayCount),
      },
      newCustomers: { current: newCustomersCurrentMonth, trend: dashboardTrend(newCustomersCurrentMonth, newCustomersPreviousMonth) },
      totalCustomers: { current: registeredCustomerCount },
    };

    return { chart, stats, timeZone };
  }
}
