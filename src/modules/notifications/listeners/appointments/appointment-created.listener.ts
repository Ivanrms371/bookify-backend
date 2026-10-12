import { AppointmentNotificationRepository } from '../../infraestructure/repositories/appointment-notification.repository';
import type { AppointmentReminderRecipient } from '../../types/appointment-notification.type';
import { appointmentDate } from '../../application/utils/appointment-date';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../application/services/notifications.service';
import { CreatedByType, RecipientType } from 'src/generated/prisma/enums';
import { isAfter, subHours } from 'date-fns';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';

@Injectable()
export class AppointmentCreatedListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly appointments: AppointmentNotificationRepository,
  ) {}

  @OnEvent('appointment.created', { async: true })
  async handle(event: AppointmentCreatedEvent) {
    const appointment = await this.appointments.findById(event.tenantId, event.appointmentId);
    if (!appointment) return;
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return;
    const payload = {
      appointmentId: event.appointmentId,
      professionalName: appointment.professionalName,
      serviceName: appointment.serviceName,
      customerName: appointment.customerName,
      ...appointmentDate(appointment.startsAt, appointment.timeZone),
      createdBy: appointment.createdBy,
    };

    if (appointment.createdBy === CreatedByType.CUSTOMER) {
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload: { ...payload, audience: 'PROFESSIONAL', detailsUrl: appointment.professionalDetailsUrl },
        recipientId: appointment.professionalId,
        recipientType: RecipientType.PROFESSIONAL,
        type: 'appointment.created',
        referenceId: event.appointmentId,
      });
    }

    if (!appointment.customerId) return;

    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload: { ...payload, audience: 'CUSTOMER' },
      recipientId: appointment.customerId,
      recipientType: RecipientType.CUSTOMER,
      type: 'appointment.created',
      referenceId: event.appointmentId,
    });

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
