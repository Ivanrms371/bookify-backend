import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { format, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecipientType } from 'src/generated/prisma/enums';
import { NotificationsService } from '../../application/services/notifications.service';
import { AppointmentCreatedVariables } from '../../application/templates/appointment-created/appointment-created.type';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { AppointmentBookedByEmployeeVariables } from '../../application/templates/appointment-booked-by-employee/appointment-booked-by-employee.type';

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
      employeeName,
      serviceName,
      customerName,
      cancelUrl,
      rescheduleUrl,
      createdBy,
    } = event;

    const payload = {
      appointmentId,
      employeeName,
      customerName,
      serviceName,
      cancelUrl,
      rescheduleUrl,
      date: format(startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(startAppointmentDate, 'HH:mm'),
    } as AppointmentCreatedVariables;

    if (createdBy === 'EMPLOYEE') {
      // Instant email for the Customer: "Employee booked you"
      await this.notificationsService.create({
        tenantId,
        payload: {
          customerName,
          employeeName,
          date: format(startAppointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: es }),
          time: format(startAppointmentDate, 'HH:mm'),
          appointmentId,
          serviceName,
        } as AppointmentBookedByEmployeeVariables,
        recipientId: customerId,
        recipientType: RecipientType.CUSTOMER,
        type: 'appointment.booked.by_employee',
      });
    } else {
      // Default behavior for CUSTOMER creation
      // 1. "New booking" notification for the Employee member
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
