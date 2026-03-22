import { Injectable } from '@nestjs/common';
import { endOfMonth, startOfMonth, subDays } from 'date-fns';
import { BusinessMember } from 'src/auth/types/express-request.type';
import { AppointmentsService } from 'src/modules/appointments/application/services/appointments.service';
import { BusinessStatsService } from 'src/modules/businesses/features/stats/business-stats.service';
import { BusinessQuotaService } from 'src/modules/businesses/features/quota/business-quota.service';

@Injectable()
export class DashboardBusinessService {
  constructor(
    private readonly businessDailyStats: BusinessStatsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly businessQuotaService: BusinessQuotaService,
  ) {}

  async getOverview(member: BusinessMember) {
    const { businessId } = member;

    // TODO: Implement for role, for the moment its works for Owners.

    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    const [monthlyStats, todayStats, lifetimeStats] = await Promise.all([
      this.businessDailyStats.getStatsForDateRange(businessId, startDate, endDate),
      this.businessDailyStats.getStatsForToday(businessId),
      this.businessDailyStats.getLifetimeStats(businessId),
    ]);

    const toNum = (v: unknown) => (v != null ? Number(v) : 0);
    const totalRevenueMonth = toNum(monthlyStats._sum.revenue);
    const newCustomersMonth = monthlyStats._sum.customers ?? 0;

    return {
      totalRevenueMonth,
      appointmentsToday: todayStats.appointments,
      newCustomersMonth,
      totalCustomersLifetime: lifetimeStats.totalCustomers,

      totalAppointments: monthlyStats._sum.appointments ?? 0,
      totalConfirmed: monthlyStats._sum.confirmed ?? 0,
      totalCancelled: monthlyStats._sum.cancelled ?? 0,
      totalCompleted: monthlyStats._sum.completed ?? 0,
      totalNoShow: monthlyStats._sum.noShow ?? 0,
      totalCustomers: monthlyStats._sum.customers ?? 0,
    };
  }

  async getRevenueChart(member: BusinessMember) {
    const { businessId } = member;
    const today = new Date();
    const startDate = subDays(today, 29); // last 30 days including today
    return this.businessDailyStats.getDailyRevenueForRange(businessId, startDate, today);
  }

  async getUpcomingAppointments(member: BusinessMember) {
    const { businessId } = member;

    const appointments = await this.appointmentsService.findUpcomingByBusiness(businessId);
  }

  async getQuotaUsage(member: BusinessMember) {
    const { businessId } = member;
    const quota = await this.businessQuotaService.findByBusinessId(businessId);

    if (!quota) {
      return null;
    }

    const pct = (used: number, limit: number) =>
      limit <= 0 ? (limit === -1 ? 0 : 100) : Math.min(Math.round((used / limit) * 100), 100);

    return {
      email:        { used: quota.emailCount,        limit: quota.emailLimit,        percentage: pct(quota.emailCount, quota.emailLimit) },
      whatsapp:     { used: quota.whatsappCount,     limit: quota.whatsappLimit,     percentage: pct(quota.whatsappCount, quota.whatsappLimit) },
      appointment:  { used: quota.appointmentCount,  limit: quota.appointmentLimit,  percentage: pct(quota.appointmentCount, quota.appointmentLimit) },
      professional: { used: quota.professionalCount, limit: quota.professionalLimit, percentage: pct(quota.professionalCount, quota.professionalLimit) },
      periodMonth: quota.periodMonth,
      periodYear: quota.periodYear,
    };
  }
}
