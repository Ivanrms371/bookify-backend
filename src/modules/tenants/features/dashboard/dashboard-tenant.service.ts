import { Injectable } from '@nestjs/common';
import { AppointmentMapper } from 'src/modules/appointments/application/mappers/appointment.mapper';
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { AppointmentsService } from 'src/modules/appointments/application/services/appointments.service';
import { TenantStatsService } from 'src/common/stats/tenant-stats.service';
import { TenantQuotaService } from '../quota/tenant-quota.service';
import { StaffsService } from 'src/modules/tenants/features/staffs/staffs.service';
import { MembershipRole } from 'src/generated/prisma/enums';
import { Membership } from 'src/auth/types/express-request.type';


@Injectable()
export class DashboardTenantService {
  constructor(
    private readonly tenantDailyStats: TenantStatsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly tenantQuotaService: TenantQuotaService,
    private readonly staffsService: StaffsService,
  ) {}

  async getOverview(member: Membership) {
    const { tenantId } = member;

    // TODO: Implement for role, for the moment its works for Owners.

    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    
    // Previous Month Range
    const prevStartDate = startOfMonth(subMonths(today, 1));
    const prevEndDate = endOfMonth(subMonths(today, 1));

    const [monthlyStats, todayStats, lifetimeStats, prevMonthlyStats] = await Promise.all([
      this.tenantDailyStats.getStatsForDateRange(tenantId, startDate, endDate),
      this.tenantDailyStats.getStatsForToday(tenantId),
      this.tenantDailyStats.getLifetimeStats(tenantId),
      this.tenantDailyStats.getStatsForDateRange(tenantId, prevStartDate, prevEndDate),
    ]);

    console.log(monthlyStats);
    

    const toNum = (v: unknown) => (v != null ? Number(v) : 0);
    const totalRevenueMonth = toNum(monthlyStats._sum?.revenue);
    const totalRevenuePreviousMonth = toNum(prevMonthlyStats._sum?.revenue);
    const newCustomersMonth = monthlyStats._sum?.newCustomers ?? 0;

    return {
      totalRevenueMonth,
      totalRevenuePreviousMonth,
      appointmentsToday: todayStats.appointments,
      newCustomersMonth,
      totalCustomersLifetime: lifetimeStats.totalCustomers,

      totalAppointments: monthlyStats._sum?.appointments ?? 0,
      totalConfirmed: monthlyStats._sum?.confirmed ?? 0,
      totalCancelled: monthlyStats._sum?.cancelled ?? 0,
      totalCompleted: monthlyStats._sum?.completed ?? 0,
      totalNoShow: monthlyStats._sum?.noShow ?? 0,
      totalCustomers: monthlyStats._sum?.newCustomers ?? 0,
    };
  }

  async getRevenueChart(member: Membership) {
    const { tenantId } = member;
    const today = new Date();
    const startDate = subDays(today, 29); // last 30 days including today
    return this.tenantDailyStats.getDailyRevenueForRange(tenantId, startDate, today);
  }

  async getUpcomingAppointments(member: Membership) {
    const { tenantId, role, userId } = member;

    let staffId: string | undefined;

    if (role === MembershipRole.STAFF) {
      const staff = await this.staffsService.findByUserIdAndTenantId(userId, tenantId);
      if (staff) {
        staffId = staff.id;
      }
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [appointments, todayCount] = await Promise.all([
      this.appointmentsService.getDashboardUpcoming(tenantId, staffId),
      this.appointmentsService.countDashboardTodayAppointments(tenantId, todayStart, todayEnd, staffId),
    ]);

    const mappedAppointments = appointments.map(AppointmentMapper.toDashboardUpcoming);

    return {
      todayCount,
      appointments: mappedAppointments,
    };
  }

  async getQuotaUsage(member: Membership) {
    const { tenantId } = member;
    const quota = await this.tenantQuotaService.findByTenantId(tenantId);

    if (!quota) {
      return null;
    }

    const pct = (used: number, limit: number) => (limit <= 0 ? (limit === -1 ? 0 : 100) : Math.min(Math.round((used / limit) * 100), 100));

    return {
      email: { used: quota.emailCount, limit: quota.emailLimit, percentage: pct(quota.emailCount, quota.emailLimit) },
      whatsapp: { used: quota.whatsappCount, limit: quota.whatsappLimit, percentage: pct(quota.whatsappCount, quota.whatsappLimit) },
      appointment: {
        used: quota.appointmentCount,
        limit: quota.appointmentLimit,
        percentage: pct(quota.appointmentCount, quota.appointmentLimit),
      },
      professional: {
        used: quota.professionalCount,
        limit: quota.professionalLimit,
        percentage: pct(quota.professionalCount, quota.professionalLimit),
      },
      periodMonth: quota.periodMonth,
      periodYear: quota.periodYear,
    };
  }
}
