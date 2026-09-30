import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../application/services/notifications.service';
import { CreatedByType, RecipientType } from 'src/generated/prisma/enums';
import { format, isAfter, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';

@Injectable()
export class AppointmentCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.created', { async: true })
  async handle(event: AppointmentCreatedEvent) {
    const payload = {
      appointmentId: event.appointmentId,
      professionalName: event.professionalName,
      serviceName: event.serviceName,
      customerName: event.customerName,
      cancelUrl: event.cancelUrl,
      rescheduleUrl: event.rescheduleUrl,
      detailsUrl: event.detailsUrl,
      date: format(event.startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(event.startAppointmentDate, 'HH:mm'),
      createdBy: event.createdBy,
    };

    if (event.createdBy === CreatedByType.CUSTOMER && event.userId) {
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.userId,
        recipientType: RecipientType.USER,
        type: 'appointment.created',
        referenceId: event.appointmentId,
      });
    }

    if (event.createdBy === CreatedByType.STAFF && event.customerId) {
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.customerId,
        recipientType: RecipientType.CUSTOMER,
        type: 'appointment.created',
        referenceId: event.appointmentId,
      });
    }

    if (!event.customerId) {
      return;
    }

    await this.scheduleCustomerReminder(event, payload, '24h', subHours(event.startAppointmentDate, 24));
    await this.scheduleCustomerReminder(event, payload, '2h', subHours(event.startAppointmentDate, 2));
  }

  private async scheduleCustomerReminder(
    event: AppointmentCreatedEvent,
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
