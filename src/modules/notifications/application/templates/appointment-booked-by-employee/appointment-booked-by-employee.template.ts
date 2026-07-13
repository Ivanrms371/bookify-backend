import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { AppointmentBookedByEmployeeVariables } from './appointment-booked-by-employee.type';
import { AppointmentBookedByEmployeeEmail } from './email.template';
import { NotImplementedError } from 'src/modules/notifications/errors/not-implemented.error';

@Injectable()
export class AppointmentBookedByEmployeeTemplate implements NotificationTemplate {
  type = 'appointment.booked.by_employee';

  build(channel: NotificationChannel, variables: AppointmentBookedByEmployeeVariables) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        throw new NotImplementedError();
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: AppointmentBookedByEmployeeVariables): BuildEmailResponse {
    return {
      subject: `Cita reservada - para el ${variables.date}`,
      react: AppointmentBookedByEmployeeEmail(variables),
    };
  }
}
