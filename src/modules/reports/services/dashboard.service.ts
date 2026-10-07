import { Injectable } from '@nestjs/common';
import { startOfDay, endOfDay } from 'date-fns';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { ReportMetricsService } from './report-metrics.service';
import type { DashboardOverviewResponse, DashboardUpcomingAppointment } from '../types/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly metrics: ReportMetricsService, private readonly dashboardRepository: DashboardRepository) {}

  async getOverview(tenantId: string): Promise<DashboardOverviewResponse> {
    const now = new Date();
    const today = startOfDay(now);

    const [{ chart, stats }, todayAppointments] = await Promise.all([
      this.metrics.getDashboardMetrics(tenantId, now),
      this.dashboardRepository.findAppointmentsByDateRange(tenantId, today, endOfDay(now)),
    ]);

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
