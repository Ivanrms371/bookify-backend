import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledByStaffEvent } from 'src/modules/appointments/domain/events/appointment-cancelled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { RecipientType } from 'src/generated/prisma/enums';
import { AppointmentCancelledByStaffVariables } from 'src/modules/notifications/application/templates/appointment-cancelled-by-staff/appointment-cancelled-by-staff.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppointmentCancelledByStaffListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.cancelled.by_staff', { async: true })
  async handle(event: AppointmentCancelledByStaffEvent) {
    const payload = {
      appointmentId: event.appointmentId,
      staffName: event.staffName,
      customerName: event.customerName,
      date: format(event.startTime, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(event.startTime, 'HH:mm'),
    } as AppointmentCancelledByStaffVariables;

    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload,
      recipientId: event.userId,
      recipientType: RecipientType.USER,
      type: 'appointment.cancelled.by_staff',
    });
  }
}
