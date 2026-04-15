import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { format, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecipientType } from 'src/generated/prisma/enums';
import { NotificationsService } from '../../application/services/notifications.service';
import { AppointmentCreatedVariables } from '../../application/templates/appointment-created/appointment-created.type';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { AppointmentBookedByStaffVariables } from '../../application/templates/appointment-booked-by-staff/appointment-booked-by-staff.type';

@Injectable()
export class AppointmentCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('appointment.created', { async: true })
  async handle(event: AppointmentCreatedEvent) {
    const {
      startAppointmentDate,
      tenantId,
      userId,
      customerId,
      appointmentId,
      staffName,
      serviceName,
      customerName,
      cancelUrl,
      rescheduleUrl,
      createdBy,
    } = event;

    const payload = {
      appointmentId,
      staffName,
      customerName,
      serviceName,
      cancelUrl,
      rescheduleUrl,
      date: format(startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(startAppointmentDate, 'HH:mm'),
    } as AppointmentCreatedVariables;

    if (createdBy === 'STAFF') {
      // Instant email for the Customer: "Staff booked you"
      await this.notificationsService.create({
        tenantId,
        payload: {
          customerName,
          staffName,
          date: format(startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
          time: format(startAppointmentDate, 'HH:mm'),
          appointmentId,
          serviceName,
        } as AppointmentBookedByStaffVariables,
        recipientId: customerId,
        recipientType: RecipientType.CUSTOMER,
        type: 'appointment.booked.by_staff',
      });
    } else {
      // Default behavior for CUSTOMER creation
      // 1. "New booking" notification for the Staff member
      await this.notificationsService.create({
        tenantId,
        payload,
        recipientId: userId,
        recipientType: RecipientType.USER,
        type: 'appointment.created',
      });
    }

    await this.scheduleCustomerReminders({
      startAppointmentDate,
      tenantId,
      customerId,
      payload,
    });
  }

  private async scheduleCustomerReminders(params: {
    startAppointmentDate: Date;
    tenantId: string;
    customerId: string;
    payload: AppointmentCreatedVariables;
  }) {
    const { startAppointmentDate, tenantId, customerId, payload } = params;

    const now = new Date();
    const remindersHours = [24, 2];

    for (const hours of remindersHours) {
      const executeAt = subHours(startAppointmentDate, hours);
      if (executeAt < now) continue;
      await this.notificationsService.create({
        payload,
        tenantId,
        recipientId: customerId,
        recipientType: RecipientType.CUSTOMER,
        executeAt,
        type: 'appointment.reminder',
      });
    }
  }
}
