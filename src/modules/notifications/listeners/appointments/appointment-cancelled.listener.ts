import { AppointmentNotificationRepository } from '../../infraestructure/repositories/appointment-notification.repository';
import { appointmentDate } from '../../application/utils/appointment-date';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledEvent } from 'src/modules/appointments/domain/events/appointment-cancelled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';

@Injectable()
export class AppointmentCancelledListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly appointments: AppointmentNotificationRepository,
  ) {}

  @OnEvent('appointment.cancelled', { async: true })
  async handle(event: AppointmentCancelledEvent) {
    await this.notificationsService.cancelScheduledDeliveries(event.appointmentId, 'appointment.reminder');
    const appointment = await this.appointments.findById(event.tenantId, event.appointmentId);
    if (!appointment) return;
    if (appointment.status !== 'CANCELLED') return;
    const payload = {
      appointmentId: event.appointmentId,
      professionalName: appointment.professionalName,
      customerName: appointment.customerName,
      ...appointmentDate(appointment.startsAt, appointment.timeZone),
      cancelledBy: event.cancelledBy,
      cancelledByName: event.cancelledByName,
      cancellationReason: event.cancellationReason,
    };

    const customerActed = event.cancelledBy === RecipientType.CUSTOMER;
    const recipientId = customerActed ? appointment.professionalId : appointment.customerId;
    if (!recipientId) return;
    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload: {
        ...payload,
        audience: customerActed ? 'PROFESSIONAL' : 'CUSTOMER',
        ...(customerActed ? { detailsUrl: appointment.professionalDetailsUrl } : {}),
      },
      recipientId,
      recipientType: customerActed ? RecipientType.PROFESSIONAL : RecipientType.CUSTOMER,
      type: 'appointment.cancelled',
      referenceId: event.appointmentId,
    });
  }
}
