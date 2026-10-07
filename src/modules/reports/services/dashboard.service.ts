import { Injectable } from '@nestjs/common';
import { statsDate, statsDay } from '../../appointments/stats/appointment-stats-projection';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { ReportMetricsService } from './report-metrics.service';
import type { DashboardOverviewResponse, DashboardUpcomingAppointment } from '../types/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly metrics: ReportMetricsService,
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getOverview(tenantId: string): Promise<DashboardOverviewResponse> {
    const now = new Date();
    const { chart, stats, timeZone } = await this.metrics.getDashboardMetrics(tenantId, now);
    const today = statsDate(statsDay(now, timeZone));
    const todayAppointments = await this.dashboardRepository.findAppointmentsByDateRange(tenantId, today, today, timeZone);

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
