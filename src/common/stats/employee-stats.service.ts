import { Injectable } from '@nestjs/common';
import {
  EmployeeDailyStatsUpsertArgs,
  EmployeeLifetimeStatsUpdateInput,
  EmployeeLifetimeStatsUpsertArgs,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';
import { OnAppointmentCompletedData } from 'src/modules/appointments/domain/types/on-appointment-completed.type';
import { OnAppointmentCancelledData } from 'src/modules/appointments/domain/types/on-appointment-cancelled.type';
import { OnAppointmentNoShowData } from 'src/modules/appointments/domain/types/on-appointment-no-show.type';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { getZonedStartOfDay } from '../utils/dates.util';

/**
 * Service responsible for managing employee performance metrics.
 *
 * It tracks both lifetime and daily statistics for employee members, including:
 * - Appointment counts (total, completed, cancelled, no-show).
 * - Revenue generation.
 * - Customer acquisition (new vs. returning).
 *
 * The service is designed to handle status transitions atomically, ensuring that
 * metrics remain consistent even when an appointment's status is updated multiple times.
 */
@Injectable()
export class EmployeeStatsService {
  /**
   * Updates stats when a new appointment is initially created.
   * Increments the total appointment count and optionally the new customer count.
   *
   * @param data Details of the created appointment
   * @param tx Transaction client to ensure atomicity
   */
  async onAppointmentCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await tx.employeeLifetimeStats.upsert({
      where: {
        employeeId: data.employeeId,
      },
      update: {
        totalAppointments: {
          increment: 1,
        },
        totalNewCustomers: { increment: data.isNewCustomer ? 1 : 0 },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
        totalAppointments: 1,
        totalNewCustomers: data.isNewCustomer ? 1 : 0,
      },
    });

    const date = getZonedStartOfDay(data.startTime);
    await tx.employeeDailyStats.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        appointments: {
          increment: 1,
        },
        newCustomers: {
          increment: data.isNewCustomer ? 1 : 0,
        },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
        date,
        appointments: 1,
        newCustomers: data.isNewCustomer ? 1 : 0,
      },
    });
  }

  /**
   * Updates stats when an appointment is marked as completed.
   *
   * This method handles:
   * 1. Incrementing completion metrics (count and revenue).
   * 2. Decrementing previous status metrics (e.g., if moving from NO_SHOW to COMPLETED).
   *
   * @param data Details including current revenue and previous status
   * @param tx Transaction client
   */
  async onAppointmentCompleted(data: OnAppointmentCompletedData, tx: TransactionClient) {
    const { previousStatus, revenue, employeeId, tenantId } = data;

    const upsertLifetimeStatsData: EmployeeLifetimeStatsUpsertArgs = {
      where: {
        employeeId,
      },
      create: {
        employeeId,
        tenantId,
        totalCompleted: 1,
        totalRevenue: revenue,
      },
      update: {
        totalCompleted: {
          increment: 1,
        },
        totalRevenue: {
          increment: revenue,
        },
      },
    };

    if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    } else if (previousStatus === AppointmentStatus.CANCELLED) {
      upsertLifetimeStatsData.update.totalCancelled = { decrement: 1 };
    }

    await tx.employeeLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: EmployeeDailyStatsUpsertArgs = {
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        completed: {
          increment: 1,
        },
        revenue: {
          increment: data.revenue,
        },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
        date,
        completed: 1,
        revenue: data.revenue,
      },
    };

    if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertDailyStatsData.update.noShow = { decrement: 1 };
    } else if (previousStatus === AppointmentStatus.CANCELLED) {
      upsertDailyStatsData.update.cancelled = { decrement: 1 };
    }

    await tx.employeeDailyStats.upsert(upsertDailyStatsData);
  }

  /**
   * Updates stats when an appointment is cancelled.
   *
   * Handles transitions from other states (e.g., COMPLETED -> CANCELLED) by
   * decrementing revenue and completion counts while incrementing cancellation metrics.
   *
   * @param data Details including previous status and revenue to adjust
   * @param tx Transaction client
   */
  async onAppointmentCancelled(data: OnAppointmentCancelledData, tx: TransactionClient) {
    const { previousStatus, revenue, employeeId, tenantId } = data;

    const upsertLifetimeStatsData: EmployeeLifetimeStatsUpsertArgs = {
      where: {
        employeeId,
      },
      update: {
        totalCancelled: {
          increment: 1,
        },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
        totalCancelled: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertLifetimeStatsData.update.totalCompleted = { decrement: 1 };
      upsertLifetimeStatsData.update.totalRevenue = { decrement: revenue };
    } else if (previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    }

    await tx.employeeLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: EmployeeDailyStatsUpsertArgs = {
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        cancelled: {
          increment: 1,
        },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
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

    await tx.employeeDailyStats.upsert(upsertDailyStatsData);
  }

  /**
   * Updates stats when a customer fails to show up (No-Show).
   *
   * If the appointment was previously COMPLETED, this method will roll back
   * the associated revenue and completion counts before incrementing the no-show count.
   *
   * @param data Details including previous status and revenue to adjust
   * @param tx Transaction client
   */
  async onAppointmentNoShow(data: OnAppointmentNoShowData, tx: TransactionClient) {
    const { previousStatus, revenue, employeeId } = data;

    const upsertLifetimeStatsData: EmployeeLifetimeStatsUpsertArgs = {
      where: {
        employeeId,
      },
      create: {
        employeeId,
        tenantId: data.tenantId,
        totalNoShow: 1,
      },
      update: {
        totalNoShow: {
          increment: 1,
        },
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertLifetimeStatsData.update.totalCompleted = { decrement: 1 };
      upsertLifetimeStatsData.update.totalRevenue = { decrement: revenue };
    }

    await tx.employeeLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: EmployeeDailyStatsUpsertArgs = {
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        noShow: {
          increment: 1,
        },
      },
      create: {
        employeeId: data.employeeId,
        tenantId: data.tenantId,
        date,
        noShow: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    }

    await tx.employeeDailyStats.upsert(upsertDailyStatsData);
  }
}
