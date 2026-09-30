import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentRescheduledEvent } from 'src/modules/appointments/domain/events/appointment-rescheduled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';
import { format, isAfter, subHours } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class AppointmentRescheduledListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.rescheduled', { async: true })
  async handle(event: AppointmentRescheduledEvent) {
    if (!event.customerId) {
      return;
    }

    const payload = {
      appointmentId: event.appointmentId,
      professionalName: event.professionalName,
      serviceName: event.serviceName,
      customerName: event.customerName,
      cancelUrl: event.cancelUrl,
      rescheduleUrl: event.rescheduleUrl,
      detailsUrl: event.detailsUrl,
      previousDate: format(event.previousStartsAt, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      previousTime: format(event.previousStartsAt, 'HH:mm'),
      date: format(event.startsAt, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(event.startsAt, 'HH:mm'),
      rescheduleReason: event.rescheduleReason,
      rescheduledByName: event.rescheduledByName,
      rescheduledBy: event.rescheduledBy,
    };

    await this.notificationsService.cancelScheduledDeliveries(event.appointmentId, 'appointment.reminder');

    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload,
      recipientId: event.customerId,
      recipientType: RecipientType.CUSTOMER,
      type: 'appointment.rescheduled',
      referenceId: event.appointmentId,
    });

    await this.scheduleCustomerReminder(event, payload, '24h', subHours(event.startsAt, 24));
    await this.scheduleCustomerReminder(event, payload, '2h', subHours(event.startsAt, 2));
  }

  private async scheduleCustomerReminder(
    event: AppointmentRescheduledEvent,
    payload: Record<string, any>,
    reminderType: '24h' | '2h',
    executeAt: Date,
  ) {
    if (!event.customerId || !isAfter(executeAt, new Date())) {
      return;
    }

    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload: {
        ...payload,
        reminderType,
      },
      recipientId: event.customerId,
      recipientType: RecipientType.CUSTOMER,
      type: 'appointment.reminder',
      referenceId: event.appointmentId,
      executeAt,
    });
  }
}
