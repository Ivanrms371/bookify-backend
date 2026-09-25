import { Injectable } from '@nestjs/common';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { DashboardRepository } from './dashboard.repository';
import type { DashboardChartEntry, DashboardOverviewResponse, DashboardStats, DashboardUpcomingAppointment } from './types/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getOverview(tenantId: string): Promise<DashboardOverviewResponse> {
    const now = new Date();
    const today = startOfDay(now);

    // ── Date ranges ───────────────────────────────────────────────────────
    const last30Start = subDays(today, 29); // last 30 calendar days incl. today
    const last30End = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // ── Parallel DB fetches (3 queries) ───────────────────────────────────
    const [dailyStats, lifetimeStats, todayAppointments] = await Promise.all([
      this.dashboardRepository.findDailyStatsByDateRange(tenantId, last30Start, last30End),
      this.dashboardRepository.findLifetimeStats(tenantId),
      this.dashboardRepository.findAppointmentsByDateRange(tenantId, today, endOfDay(now)),
    ]);

    // ── Chart: map all 30-day rows ────────────────────────────────────────
    const chart: DashboardChartEntry[] = dailyStats.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      revenue: Number(row.revenue),
      appointments: row.appointments,
      confirmed: row.confirmed,
      cancelled: row.cancelled,
      completed: row.completed,
      noShow: row.noShow,
      newCustomers: row.newCustomers,
    }));

    // ── Stats: aggregate current-month rows from the already-fetched 30-day window ──
    const monthStart_ms = monthStart.getTime();
    const monthEnd_ms = monthEnd.getTime();

    const monthRows = dailyStats.filter((row) => {
      const d = row.date.getTime();
      return d >= monthStart_ms && d <= monthEnd_ms;
    });

    const revenueCurrentMonth = monthRows.reduce((acc, r) => acc + Number(r.revenue), 0);
    const newCustomersCurrentMonth = monthRows.reduce((acc, r) => acc + r.newCustomers, 0);

    const todayStr = today.toISOString().split('T')[0];
    const todayDailyRow = dailyStats.find((r) => r.date.toISOString().split('T')[0] === todayStr);
    const appointmentsTodayCount = todayDailyRow?.appointments ?? 0;

    const stats: DashboardStats = {
      revenue: { current: revenueCurrentMonth, trend: '' },
      appointmentsToday: { current: appointmentsTodayCount, trend: '' },
      newCustomers: { current: newCustomersCurrentMonth, trend: '' },
      totalCustomers: { current: lifetimeStats?.totalCustomers ?? 0 },
    };

    // ── Upcoming appointments (today's list from appointments table) ───────
    const upcomingAppointments: DashboardUpcomingAppointment[] = todayAppointments.map((appt) => ({
      id: appt.id,
      status: appt.status,
      startsAt: appt.startsAt.toISOString(),
      endsAt: appt.endsAt.toISOString(),
      customerName: appt.customerName,
      confirmationCode: appt.manageToken ?? '',
      durationMinutes: appt.durationMinutes,
      professional: {
        id: appt.professional.id,
        name: appt.professional.name,
        avatarUrl: appt.professional.avatarUrl,
        colorTheme: appt.professional.colorTheme,
      },
      service: appt.service
        ? {
            name: appt.service.name,
            price: Number(appt.service.price),
          }
        : undefined,
    }));

    return { chart, stats, upcomingAppointments };
  }
}
