import { Injectable } from '@nestjs/common';
import {
  StaffDailyStatsUpsertArgs,
  StaffLifetimeStatsUpdateInput,
  StaffLifetimeStatsUpsertArgs,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';
import { OnAppointmentCompletedData } from 'src/modules/appointments/domain/types/on-appointment-completed.type';
import { OnAppointmentCancelledData } from 'src/modules/appointments/domain/types/on-appointment-cancelled.type';
import { OnAppointmentNoShowData } from 'src/modules/appointments/domain/types/on-appointment-no-show.type';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { getZonedStartOfDay } from '../utils/dates.util';

/**
 * Service responsible for managing staff performance metrics.
 * 
 * It tracks both lifetime and daily statistics for staff members, including:
 * - Appointment counts (total, completed, cancelled, no-show).
 * - Revenue generation.
 * - Customer acquisition (new vs. returning).
 * 
 * The service is designed to handle status transitions atomically, ensuring that
 * metrics remain consistent even when an appointment's status is updated multiple times.
 */
@Injectable()
export class StaffStatsService {
  /**
   * Updates stats when a new appointment is initially created.
   * Increments the total appointment count and optionally the new customer count.
   * 
   * @param data Details of the created appointment
   * @param tx Transaction client to ensure atomicity
   */
  async onAppointmentCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await tx.staffLifetimeStats.upsert({
      where: {
        staffId: data.staffId,
      },
      update: {
        totalAppointments: {
          increment: 1,
        },
        totalNewCustomers: { increment: data.isNewCustomer ? 1 : 0 },
      },
      create: {
        staffId: data.staffId,
        tenantId: data.tenantId,
        totalAppointments: 1,
        totalNewCustomers: data.isNewCustomer ? 1 : 0,
      },
    });

    const date = getZonedStartOfDay(data.startTime);
    await tx.staffDailyStats.upsert({
      where: {
        staffId_date: {
          staffId: data.staffId,
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
        staffId: data.staffId,
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

    const { previousStatus, revenue, staffId, tenantId } = data;

    const upsertLifetimeStatsData: StaffLifetimeStatsUpsertArgs = {
      where: {
        staffId,
      },
      create: {
        staffId,
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

    if(previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    } else if(previousStatus === AppointmentStatus.CANCELLED) {
      upsertLifetimeStatsData.update.totalCancelled = { decrement: 1 };
    }

    await tx.staffLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: StaffDailyStatsUpsertArgs = {
      where: {
        staffId_date: {
          staffId: data.staffId,
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
        staffId: data.staffId,
        tenantId: data.tenantId,
        date,
        completed: 1,
        revenue: data.revenue,
      },
    };

    if(previousStatus === AppointmentStatus.NO_SHOW) {
      upsertDailyStatsData.update.noShow = { decrement: 1 };
    } else if(previousStatus === AppointmentStatus.CANCELLED) {
      upsertDailyStatsData.update.cancelled = { decrement: 1 };
    }

    await tx.staffDailyStats.upsert(upsertDailyStatsData);
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
    const { previousStatus, revenue, staffId, tenantId } = data;


    const upsertLifetimeStatsData: StaffLifetimeStatsUpsertArgs = {
      where: {
        staffId,
      },
      update: {
        totalCancelled: {
          increment: 1,
        },
      },
      create: {
        staffId: data.staffId,
        tenantId: data.tenantId,
        totalCancelled: 1,
      },
    };

    if(previousStatus === AppointmentStatus.COMPLETED) {
      upsertLifetimeStatsData.update.totalCompleted = { decrement: 1 };
      upsertLifetimeStatsData.update.totalRevenue = { decrement: revenue };
    } else if(previousStatus === AppointmentStatus.NO_SHOW) {
      upsertLifetimeStatsData.update.totalNoShow = { decrement: 1 };
    }

    await tx.staffLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: StaffDailyStatsUpsertArgs = {
      where: {
        staffId_date: {
          staffId: data.staffId,
          date,
        },
      },
      update: {
        cancelled: {
          increment: 1,
        },
      },
      create: {
        staffId: data.staffId,
        tenantId: data.tenantId,
        date,
        cancelled: 1,
      },
    };

    if(previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    } else if(previousStatus === AppointmentStatus.NO_SHOW) {
      upsertDailyStatsData.update.noShow = { decrement: 1 };
    }

    await tx.staffDailyStats.upsert(upsertDailyStatsData);
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
    const { previousStatus, revenue, staffId } = data;

    const upsertLifetimeStatsData: StaffLifetimeStatsUpsertArgs = {
      where: {
        staffId,
      },
      create: {
        staffId,
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

    await tx.staffLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startTime);

    const upsertDailyStatsData: StaffDailyStatsUpsertArgs = {
      where: {
        staffId_date: {
          staffId: data.staffId,
          date,
        },
      },
      update: {
        noShow: {
          increment: 1,
        },
      },
      create: {
        staffId: data.staffId,
        tenantId: data.tenantId,
        date,
        noShow: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    }

    await tx.staffDailyStats.upsert(upsertDailyStatsData);
  }
}

