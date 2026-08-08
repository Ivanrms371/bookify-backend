import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';
import { OnAppointmentCompletedData } from 'src/modules/appointments/domain/types/on-appointment-completed.type';
import { OnAppointmentCancelledData } from 'src/modules/appointments/domain/types/on-appointment-cancelled.type';
import { OnAppointmentNoShowData } from 'src/modules/appointments/domain/types/on-appointment-no-show.type';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { getZonedStartOfDay } from '../utils/dates.util';
import { ProfessionalLifetimeStatsUpsertArgs } from 'src/generated/prisma/models/ProfessionalLifetimeStats';
import { ProfessionalDailyStatsUpsertArgs } from 'src/generated/prisma/models/ProfessionalDailyStats';

/**
 * Service responsible for managing professional performance metrics.
 *
 * It tracks both lifetime and daily statistics for professional members, including:
 * - Appointment counts (total, completed, cancelled, no-show).
 * - Revenue generation.
 * - Customer acquisition (new vs. returning).
 *
 * The service is designed to handle status transitions atomically, ensuring that
 * metrics remain consistent even when an appointment's status is updated multiple times.
 */
@Injectable()
export class ProfessionalStatsService {
  /**
   * Updates stats when a new appointment is initially created.
   * Increments the total appointment count and optionally the new customer count.
   *
   * @param data Details of the created appointment
   * @param tx Transaction client to ensure atomicity
   */
  async onAppointmentCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await tx.professionalLifetimeStats.upsert({
      where: {
        professionalId: data.professionalId,
      },
      update: {
        totalAppointments: {
          increment: 1,
        },
        totalNewCustomers: { increment: data.isNewCustomer ? 1 : 0 },
      },
      create: {
        professionalId: data.professionalId,
        tenantId: data.tenantId,
        totalAppointments: 1,
        totalNewCustomers: data.isNewCustomer ? 1 : 0,
      },
    });

    const date = getZonedStartOfDay(data.startsAt);
    await tx.professionalDailyStats.upsert({
      where: {
        professionalId_date: {
          professionalId: data.professionalId,
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
        professionalId: data.professionalId,
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
    const { previousStatus, revenue, professionalId, tenantId } = data;

    const upsertLifetimeStatsData: ProfessionalLifetimeStatsUpsertArgs = {
      where: {
        professionalId,
      },
      create: {
        professionalId,
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

    await tx.professionalLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startsAt);

    const upsertDailyStatsData: ProfessionalDailyStatsUpsertArgs = {
      where: {
        professionalId_date: {
          professionalId: data.professionalId,
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
        professionalId: data.professionalId,
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

    await tx.professionalDailyStats.upsert(upsertDailyStatsData);
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
    const { previousStatus, revenue, professionalId, tenantId } = data;

    const upsertLifetimeStatsData: ProfessionalLifetimeStatsUpsertArgs = {
      where: {
        professionalId,
      },
      update: {
        totalCancelled: {
          increment: 1,
        },
      },
      create: {
        professionalId: data.professionalId,
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

    await tx.professionalLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startsAt);

    const upsertDailyStatsData: ProfessionalDailyStatsUpsertArgs = {
      where: {
        professionalId_date: {
          professionalId: data.professionalId,
          date,
        },
      },
      update: {
        cancelled: {
          increment: 1,
        },
      },
      create: {
        professionalId: data.professionalId,
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

    await tx.professionalDailyStats.upsert(upsertDailyStatsData);
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
    const { previousStatus, revenue, professionalId } = data;

    const upsertLifetimeStatsData: ProfessionalLifetimeStatsUpsertArgs = {
      where: {
        professionalId,
      },
      create: {
        professionalId,
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

    await tx.professionalLifetimeStats.upsert(upsertLifetimeStatsData);

    const date = getZonedStartOfDay(data.startsAt);

    const upsertDailyStatsData: ProfessionalDailyStatsUpsertArgs = {
      where: {
        professionalId_date: {
          professionalId: data.professionalId,
          date,
        },
      },
      update: {
        noShow: {
          increment: 1,
        },
      },
      create: {
        professionalId: data.professionalId,
        tenantId: data.tenantId,
        date,
        noShow: 1,
      },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      upsertDailyStatsData.update.completed = { decrement: 1 };
      upsertDailyStatsData.update.revenue = { decrement: revenue };
    }

    await tx.professionalDailyStats.upsert(upsertDailyStatsData);
  }
}
