import { Injectable } from '@nestjs/common';
import { AppointmentMapper } from 'src/modules/appointments/application/mappers/appointment.mapper';
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { AppointmentsService } from 'src/modules/appointments/application/services/appointments.service';
import { TenantStatsService } from 'src/common/stats/tenant-stats.service';
import { EmployeeStatsService } from 'src/common/stats/employee-stats.service';
import { TenantUsageService } from '../usage/tenant-usage.service';
import { EmployeesService } from 'src/modules/tenants/features/employees/employees.service';
import { MembershipRole } from 'src/generated/prisma/enums';
import { Membership } from 'src/auth/types/express-request.type';

@Injectable()
export class DashboardTenantService {
  constructor(
    private readonly tenantDailyStats: TenantStatsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly tenantUsageService: TenantUsageService,
    private readonly employeesService: EmployeesService,
  ) {}

  async getOverview(member: Membership) {
    const { tenantId, role, userId } = member;

    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    // Previous Month Range
    const prevStartDate = startOfMonth(subMonths(today, 1));
    const prevEndDate = endOfMonth(subMonths(today, 1));

    // Resolve employee profile for context (OWNERs also have employee profiles to take appointments)
    const employee = await this.employeesService.findByUserAndTenant(userId, tenantId);
    let employeeIdForAppointments: string | undefined;
    if (employee) {
      employeeIdForAppointments = employee.id;
    }

    let monthlyStats: any;
    let todayStats: any;
    let lifetimeStats: any;
    let prevMonthlyStats: any;

    if (role === MembershipRole.EMPLOYEE && employee) {
      // [monthlyStats, todayStats, lifetimeStats, prevMonthlyStats] = await Promise.all([
      //   this.employeeStatsService.getStatsForDateRange(employee.id, startDate, endDate),
      //   this.employeeStatsService.getStatsForToday(employee.id),
      //   this.employeeStatsService.getLifetimeStats(employee.id),
      //   this.employeeStatsService.getStatsForDateRange(employee.id, prevStartDate, prevEndDate),
      // ]);
    } else {
      [monthlyStats, todayStats, lifetimeStats, prevMonthlyStats] = await Promise.all([
        this.tenantDailyStats.getStatsForDateRange(tenantId, startDate, endDate),
        this.tenantDailyStats.getStatsForToday(tenantId),
        this.tenantDailyStats.getLifetimeStats(tenantId),
        this.tenantDailyStats.getStatsForDateRange(tenantId, prevStartDate, prevEndDate),
      ]);
    }

    const upcomingCount = await this.appointmentsService.countDashboardUpcomingAppointments(tenantId, employeeIdForAppointments);

    const toNum = (v: unknown) => (v != null ? Number(v) : 0);
    const totalRevenueMonth = toNum(monthlyStats?._sum?.revenue);
    const totalRevenuePreviousMonth = toNum(prevMonthlyStats?._sum?.revenue);
    const newCustomersMonth = monthlyStats?._sum?.newCustomers ?? 0;

    return {
      totalRevenueMonth,
      totalRevenuePreviousMonth,
      appointmentsToday: todayStats?.appointments ?? 0,
      upcomingCount,
      newCustomersMonth,
      totalCustomersLifetime: lifetimeStats?.totalCustomers ?? 0,

      totalAppointments: monthlyStats?._sum?.appointments ?? 0,
      totalConfirmed: monthlyStats?._sum?.confirmed ?? 0,
      totalCancelled: monthlyStats?._sum?.cancelled ?? 0,
      totalCompleted: monthlyStats?._sum?.completed ?? 0,
      totalNoShow: monthlyStats?._sum?.noShow ?? 0,
      totalCustomers: monthlyStats?._sum?.newCustomers ?? 0,
    };
  }

  async getRevenueChart(member: Membership) {
    const { tenantId, role, userId } = member;
    const today = new Date();
    const startDate = subDays(today, 29); // last 30 days including today

    let employeeId: string | undefined;

    if (role === MembershipRole.EMPLOYEE) {
      const employee = await this.employeesService.findByUserAndTenant(userId, tenantId);
      if (employee) {
        employeeId = employee.id;
      }
    }

    if (role === MembershipRole.EMPLOYEE && employeeId) {
      // return this.employeeStatsService.getDailyRevenueForRange(employeeId, startDate, today);
    } else {
      return this.tenantDailyStats.getDailyRevenueForRange(tenantId, startDate, today);
    }
  }

  async getUpcomingAppointments(member: Membership) {
    const { tenantId, role, userId } = member;

    let employeeId: string | undefined;

    // Always fetch the context employee ID so owners only see their personal upcoming appointments
    const employee = await this.employeesService.findByUserAndTenant(userId, tenantId);
    if (employee) {
      employeeId = employee.id;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [appointments, todayCount] = await Promise.all([
      this.appointmentsService.getDashboardUpcoming(tenantId, employeeId),
      this.appointmentsService.countDashboardUpcomingAppointments(tenantId, employeeId),
    ]);

    const mappedAppointments = appointments.map(AppointmentMapper.toDashboardUpcoming);

    return {
      todayCount,
      appointments: mappedAppointments,
    };
  }

  async getQuotaUsage(member: Membership) {
    const { tenantId } = member;
    const quota = await this.tenantUsageService.findByTenantId(tenantId);

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
      periodMonth: quota.periodMonth,
      periodYear: quota.periodYear,
    };
  }
}
