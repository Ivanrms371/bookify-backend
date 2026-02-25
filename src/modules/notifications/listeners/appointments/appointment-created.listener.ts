import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { format, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecipientType } from 'src/generated/prisma/enums';
import { NotificationsService } from '../../application/services/notifications.service';
import { AppointmentCreatedVariables } from '../../application/templates/appointment-created/appointment-created.type';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';

@Injectable()
export class AppointmentCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.created', { async: true })
  async handle(event: AppointmentCreatedEvent) {
    const { startAppointmentDate, businessId, userId, customerId, appointmentId, staffName, serviceName, customerName } = event;

    const payload = {
      appointmentId,
      staffName,
      customerName,
      serviceName,
      date: format(startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(startAppointmentDate, 'HH:mm'),
    } as AppointmentCreatedVariables;

    await this.notificationsService.create({
      businessId,
      payload,
      recipientId: userId,
      recipientType: RecipientType.USER,
      type: 'appointment.created',
    });

    await this.scheduleCustomerReminders({
      startAppointmentDate,
      businessId,
      customerId,
      payload,
    });
  }

  private async scheduleCustomerReminders(params: {
    startAppointmentDate: Date;
    businessId: string;
    customerId: string;
    payload: AppointmentCreatedVariables;
  }) {
    const { startAppointmentDate, businessId, customerId, payload } = params;

    const now = new Date();
    const remindersHours = [24, 2];

    for (const hours of remindersHours) {
      const executeAt = subHours(startAppointmentDate, hours);
      if (executeAt < now) continue;
      await this.notificationsService.create({
        payload,
        businessId,
        recipientId: customerId,
        recipientType: RecipientType.CUSTOMER,
        executeAt,
        type: 'appointment.reminder',
      });
    }
  }
}
