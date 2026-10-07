import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledEvent } from 'src/modules/appointments/domain/events/appointment-cancelled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';
import { AppointmentCancelledVariables } from '../../application/templates/appointment-cancelled/appointment-cancelled.type';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class AppointmentCancelledListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.cancelled', { async: true })
  async handle(event: AppointmentCancelledEvent) {
    const payload = {
      appointmentId: event.appointmentId,
      professionalName: event.professionalName,
      customerName: event.customerName,
      date: format(event.startsAt, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(event.startsAt, 'HH:mm'),
      cancelledBy: event.cancelledBy,
      cancelledByName: event.cancelledByName,
      cancellationReason: event.cancellationReason,
    };

    await this.notificationsService.cancelScheduledDeliveries(event.appointmentId, 'appointment.reminder');

    if (event.cancelledBy === RecipientType.CUSTOMER) {
      if (!event.userId) return;
      // Professional xxx your customer has cancelled your appointment.
      // In this case we send the notification to the professional
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.userId,
        recipientType: RecipientType.USER,
        type: 'appointment.cancelled',
      });
    } else {
      // Customer xxx your professional has cancelled your appointent.
      // In this case we send the notifications to the customer
      await this.notificationsService.create({
        tenantId: event.tenantId,
        payload,
        recipientId: event.customerId,
        recipientType: RecipientType.CUSTOMER,
        type: 'appointment.cancelled',
      });
    }
  }
}
