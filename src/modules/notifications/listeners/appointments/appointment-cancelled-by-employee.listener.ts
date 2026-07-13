import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledByEmployeeEvent } from 'src/modules/appointments/domain/events/appointment-cancelled.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { RecipientType } from 'src/generated/prisma/enums';
import { AppointmentCancelledByEmployeeVariables } from 'src/modules/notifications/application/templates/appointment-cancelled-by-employee/appointment-cancelled-by-employee.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppointmentCancelledByEmployeeListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.cancelled.by_employee', { async: true })
  async handle(event: AppointmentCancelledByEmployeeEvent) {
    const payload = {
      appointmentId: event.appointmentId,
      employeeName: event.employeeName,
      customerName: event.customerName,
      date: format(event.startTime, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(event.startTime, 'HH:mm'),
    } as AppointmentCancelledByEmployeeVariables;

    await this.notificationsService.create({
      tenantId: event.tenantId,
      payload,
      recipientId: event.userId,
      recipientType: RecipientType.USER,
      type: 'appointment.cancelled.by_employee',
    });
  }
}
