import { Injectable } from '@nestjs/common';
import { CustomerUpdateArgs, CustomerUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';
import { OnAppointmentCancelledData } from 'src/modules/appointments/domain/types/on-appointment-cancelled.type';
import { OnAppointmentNoShowData } from 'src/modules/appointments/domain/types/on-appointment-no-show.type';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { OnAppointmentCompletedData } from 'src/modules/appointments/domain/types/on-appointment-completed.type';

/**
 * Service responsible for managing individual customer behavioral metrics.
 *
 * It tracks engagement data for each customer, including:
 * - Appointment history (total, completed, cancelled, no-show).
 * - Financial metrics (total revenue/spent per customer).
 * - Recency metrics (first/last appointment dates).
 *
 * These metrics are crucial for customer segmentation and ranking.
 */
@Injectable()
export class CustomerStatsService {
  /**
   * Updates customer profile when a new appointment is created.
   * Tracks recruitment date and latest activity date.
   *
   * @param data Details of the created appointment
   * @param tx Transaction client
   */
  async onAppointmentCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await tx.customer.update({
      where: {
        id: data.customerId,
      },
      data: {
        totalAppointments: {
          increment: 1,
        },
        ...(data.isNewCustomer && {
          firstAppointmentAt: new Date(),
        }),
        lastAppointmentAt: {
          set: data.startsAt,
        },
      },
    });
  }

  /**
   * Updates customer profile when an appointment is completed.
   * Decrements previous status counts if applicable (e.g., NO_SHOW -> COMPLETED).
   *
   * @param data Details including current revenue and previous status
   * @param tx Transaction client
   */
  async onAppointmentCompleted(data: OnAppointmentCompletedData, tx: TransactionClient) {
    const { previousStatus, revenue, customerId } = data;

    const updateData: CustomerUpdateInput = {
      completedAppointments: {
        increment: 1,
      },
      totalSpent: {
        increment: revenue,
      },
    };

    if (previousStatus === AppointmentStatus.NO_SHOW) {
      updateData.noShowCount = { decrement: 1 };
    } else if (previousStatus === AppointmentStatus.CANCELLED) {
      updateData.cancelledAppointments = { decrement: 1 };
    }

    await tx.customer.update({
      where: {
        id: customerId,
      },
      data: updateData,
    });
  }

  /**
   * Updates customer profile when an appointment is cancelled.
   * Adjusts total spent and completion counts if rolling back a COMPLETED state.
   *
   * @param data Details including previous status and cancellation fault logic
   * @param tx Transaction client
   */
  async onAppointmentCancelled(data: OnAppointmentCancelledData, tx: TransactionClient) {
    const { customerId, isCustomerFault, previousStatus, revenue } = data;

    const updateData: CustomerUpdateInput = {};

    // Logic for the cancellation itself
    if (isCustomerFault) {
      updateData.cancelledAppointments = { increment: 1 };
    } else {
      updateData.totalAppointments = { decrement: 1 };
    }

    // Logic for rolling back previous status
    if (previousStatus === AppointmentStatus.COMPLETED) {
      updateData.completedAppointments = { decrement: 1 };
      updateData.totalSpent = { decrement: revenue };
    } else if (previousStatus === AppointmentStatus.NO_SHOW) {
      updateData.noShowCount = { decrement: 1 };
    }

    await tx.customer.update({
      where: {
        id: customerId,
      },
      data: updateData,
    });
  }

  /**
   * Updates customer profile when an appointment is marked as no-show.
   * Rolls back revenue and completion counters if applicable.
   *
   * @param data Details including previous status and revenue
   * @param tx Transaction client
   */
  async onAppointmentNoShow(data: OnAppointmentNoShowData, tx: TransactionClient) {
    const { previousStatus, revenue, customerId } = data;

    const updateData: CustomerUpdateInput = {
      noShowCount: { increment: 1 },
    };

    if (previousStatus === AppointmentStatus.COMPLETED) {
      updateData.completedAppointments = { decrement: 1 };
      updateData.totalSpent = { decrement: revenue };
    }

    await tx.customer.update({
      where: {
        id: customerId,
      },
      data: updateData,
    });
  }
}
