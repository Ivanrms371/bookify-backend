import { Injectable } from '@nestjs/common';
import {
  TenantDailyStatsUpsertArgs,
  TenantLifetimeStatsUpsertArgs,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { eachDayOfInterval, startOfDay } from 'date-fns';
import { OnAppointmentCompletedData } from 'src/modules/appointments/domain/types/on-appointment-completed.type';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';
import { OnAppointmentCancelledData } from 'src/modules/appointments/domain/types/on-appointment-cancelled.type';
import { OnAppointmentNoShowData } from 'src/modules/appointments/domain/types/on-appointment-no-show.type';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { formatToDayKey, getZonedStartOfDay } from '../utils/dates.util';
import { PrismaService } from 'src/shared/prisma/prisma.service';

/**
 * Service responsible for managing tenant-wide cumulative statistics.
 * 
 * It monitors appointment lifecycle events to update:
 * - Lifetime metrics (total appointments, revenue, completions, etc.) for the tenant.
 * - Daily granularity stats for reporting and dashboard visualization.
 * - Quota management (limiting the number of appointments per billing cycle).
 * 
 * Like other stats services, it handles state transitions atomically to prevent 
 * double-counting or orphaned metrics.
 */
@Injectable()
export class TenantStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates global and daily stats when a new appointment is created.
   * Also increments the tenant's usage quota for the current period.
   * 
   * @param data Details of the new appointment
   * @param tx Transaction client
   */
  async onAppointmentCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await tx.tenantLifetimeStats.upsert({
      where: {
        tenantId: data.tenantId,
      },
      update: {
        totalAppointments: {
          increment: 1,
        },
      },
      create: {
        tenantId: data.tenantId,
        totalAppointments: 1,
      },
    });

    const date = getZonedStartOfDay(data.startTime);

    await tx.tenantDailyStats.upsert({
      where: {
        tenantId_date: {
          tenantId: data.tenantId,
          date,
        },
      },
      update: {
        appointments: {
          increment: 1,
        },
      },
      create: {
        tenantId: data.tenantId,
        date,
        appointments: 1,
      },
    });

    await tx.tenantQuota.update({
      where: {
        tenantId: data.tenantId,
      },
      data: {
        appointmentCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Updates stats when an appointment is completed.
   * Handles transitions from NO_SHOW or CANCELLED to COMPLETED by adjusting counters.
   * 
   * @param data Details including current revenue and previous status
   * @param tx Transaction client
   */
  async onAppointmentCompleted(data: OnAppointmentCompletedData, tx: TransactionClient) {
    const { previousStatus, revenue, tenantId } = data;

    const upsertLifetimeStatsData: TenantLifetimeStatsUpsertArgs = {
      where: {
        tenantId,
      },
      update: {
        totalCompleted: {
          increment: 1,
        },
        totalRevenue: {
          increment: revenue,
        },
      },
      create: {
        tenantId,
        totalCompleted: 1,
        totalRevenue: revenue,
      },
    };

    if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    } else if (previousStatus === AppointmentStatus.CANCELLED) {
      upsertLifetimeStatsData.update.totalCancelled = { decrement: 1 };
    }

    await tx.tenantLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: TenantDailyStatsUpsertArgs = {
      where: {
        tenantId_date: {
          tenantId,
          date,
        },
      },
      update: {
        completed: {
          increment: 1,
        },
        revenue: {
          increment: revenue,
        },
      },
      create: {
        tenantId,
        date,
        completed: 1,
        revenue: revenue,
      },
    };

    if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertDailyStatsData.update.noShow = { decrement: 1 };
    } else if (previousStatus === AppointmentStatus.CANCELLED) {
      upsertDailyStatsData.update.cancelled = { decrement: 1 };
    }

    await tx.tenantDailyStats.upsert(upsertDailyStatsData);
  }

  /**
   * Updates stats when an appointment is cancelled.
   * Decrements completion/no-show counters if an existing status is overridden.
   * 
   * @param data Details including previous status and revenue to adjust
   * @param tx Transaction client
   */
  async onAppointmentCancelled(data: OnAppointmentCancelledData, tx: TransactionClient) {
    const { previousStatus, revenue, tenantId } = data;

    const upsertLifetimeStatsData: TenantLifetimeStatsUpsertArgs = {
      where: {
        tenantId,
      },
      update: {
        totalCancelled: {
          increment: 1,
        },
      },
      create: {
        tenantId,
        totalCancelled: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertLifetimeStatsData.update.totalCompleted = { decrement: 1 };
      upsertLifetimeStatsData.update.totalRevenue = { decrement: revenue };
    } else if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    }

    await tx.tenantLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: TenantDailyStatsUpsertArgs = {
      where: {
        tenantId_date: {
          tenantId,
          date,
        },
      },
      update: {
        cancelled: {
          increment: 1,
        },
      },
      create: {
        tenantId,
        date,
        cancelled: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    } else if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertDailyStatsData.update.noShow = { decrement: 1 };
    }

    await tx.tenantDailyStats.upsert(upsertDailyStatsData);
  }

  /**
   * Updates stats when an appointment is marked as no-show.
   * If the appointment was previously completed, revenue and completion counts are rolled back.
   * 
   * @param data Details including previous status and revenue to adjust
   * @param tx Transaction client
   */
  async onAppointmentNoShow(data: OnAppointmentNoShowData, tx: TransactionClient) {
    const { previousStatus, revenue, tenantId } = data;

    const upsertData: TenantLifetimeStatsUpsertArgs = {
      where: {
        tenantId,
      },
      create: {
        tenantId,
        totalNoShow: 1,
      },
      update: {
        totalNoShow: {
          increment: 1,
        },
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertData.update.totalCompleted = { decrement: 1 };
      upsertData.update.totalRevenue = { decrement: revenue };
    }

    await tx.tenantLifetimeStats.upsert(upsertData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: TenantDailyStatsUpsertArgs = {
      where: {
        tenantId_date: {
          tenantId: data.tenantId,
          date,
        },
      },
      update: {
        noShow: {
          increment: 1,
        },
      },
      create: {
        tenantId: data.tenantId,
        date,
        noShow: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    }

    await tx.tenantDailyStats.upsert(upsertDailyStatsData);
  }

  // --- Reading Methods (Migrated for unification) ---

  async getStatsForDateRange(tenantId: string, startDate: Date, endDate: Date) {
    const result =await this.prisma.tenantDailyStats.aggregate({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: startOfDay(endDate),
        },
      },
      _sum: {
        appointments: true,
        confirmed: true,
        cancelled: true,
        completed: true,
        noShow: true,
        revenue: true,
        newCustomers: true,
      },
    });

    const dailyStats = await this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: startOfDay(endDate),
        },
      },
    });


    return result
  }

  async getStatsForToday(tenantId: string) {
    const today = getZonedStartOfDay(new Date());
    const row = await this.prisma.tenantDailyStats.findUnique({
      where: { tenantId_date: { tenantId, date: today } },
    });
    return {
      appointments: row?.appointments ?? 0,
      customers: row?.newCustomers ?? 0,
      revenue: row?.revenue ?? 0,
    };
  }

  async getLifetimeStats(tenantId: string) {
    const row = await this.prisma.tenantLifetimeStats.findUnique({
      where: { tenantId },
    });
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      totalCustomers: row?.totalCustomers ?? 0,
    };
  }

  async getDailyRevenueForRange(tenantId: string, startDate: Date, endDate: Date) {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const rows = await this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { date: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    const revenueMap = new Map(rows.map((r) => [formatToDayKey(r.date), Number(r.revenue)]));

    return eachDayOfInterval({ start, end }).map((day) => {
      const key = formatToDayKey(day);
      return { date: key, revenue: revenueMap.get(key) ?? 0 };
    });
  }
}

