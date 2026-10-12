import { AppointmentNotificationRepository } from '../../infraestructure/repositories/appointment-notification.repository';
import type { AppointmentReminderRecipient } from '../../types/appointment-notification.type';
import { appointmentDate } from '../../application/utils/appointment-date';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentRescheduledEvent } from 'src/modules/appointments/domain/events/appointment-rescheduled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';
import { isAfter, subHours } from 'date-fns';

@Injectable()
export class AppointmentRescheduledListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly appointments: AppointmentNotificationRepository,
  ) {}

  @OnEvent('appointment.rescheduled', { async: true })
  async handle(event: AppointmentRescheduledEvent) {
    await this.notificationsService.cancelScheduledDeliveries(event.appointmentId, 'appointment.reminder');
    const appointment = await this.appointments.findById(event.tenantId, event.appointmentId);
    if (!appointment) return;
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return;
    const previousDate = appointmentDate(event.previousStartsAt, appointment.timeZone);
    const payload = {
      appointmentId: event.appointmentId,
      professionalName: appointment.professionalName,
      serviceName: appointment.serviceName,
      customerName: appointment.customerName,
      previousDate: previousDate.date,
      previousTime: previousDate.time,
      ...appointmentDate(appointment.startsAt, appointment.timeZone),
      rescheduleReason: event.rescheduleReason,
      rescheduledByName: event.rescheduledByName,
      rescheduledBy: event.rescheduledBy,
    };

    const customerActed = event.rescheduledBy === RecipientType.CUSTOMER;
    const recipientId = customerActed ? appointment.professionalId : appointment.customerId;
    if (recipientId) {
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload: {
          ...payload,
          audience: customerActed ? 'PROFESSIONAL' : 'CUSTOMER',
          ...(customerActed ? { detailsUrl: appointment.professionalDetailsUrl } : {}),
        },
        recipientId,
        recipientType: customerActed ? RecipientType.PROFESSIONAL : RecipientType.CUSTOMER,
        type: 'appointment.rescheduled',
        referenceId: event.appointmentId,
      });
    }

    await this.scheduleCustomerReminder(appointment, payload, '24h', subHours(appointment.startsAt, 24));
    await this.scheduleCustomerReminder(appointment, payload, '2h', subHours(appointment.startsAt, 2));
  }

  private async scheduleCustomerReminder(
    appointment: AppointmentReminderRecipient,
    payload: Record<string, any>,
    reminderType: '24h' | '2h',
    executeAt: Date,
  ) {
    if (!appointment.customerId || !isAfter(executeAt, new Date())) {
      return;
    }

    await this.notificationsService.create({
      tenantId: appointment.tenantId,
      payload: {
        ...payload,
        reminderType,
      },
      recipientId: appointment.customerId,
      recipientType: RecipientType.CUSTOMER,
      type: 'appointment.reminder',
      referenceId: appointment.appointmentId,
      executeAt,
    });
  }
}
