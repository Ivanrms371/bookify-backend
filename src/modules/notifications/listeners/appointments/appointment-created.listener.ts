import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';
import { AppointmentCancelledVariables } from '../../application/templates/appointment-cancelled/appointment-cancelled.type';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';

@Injectable()
export class AppointmentCancelledListener {
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
      startAppointmentDate: event.startAppointmentDate,
    };

    if (event.createdBy === RecipientType.CUSTOMER) {
      // Schedule notifications
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.userId,
        recipientType: RecipientType.USER,
        type: 'appointment.created',
      });
    } else {
      // Customer xxx your professional has cancelled your appointent.
      // In this case we send the notifications to the customer
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.customerId,
        recipientType: RecipientType.CUSTOMER,
        type: 'appointment.created',
      });
    }
  }
}
