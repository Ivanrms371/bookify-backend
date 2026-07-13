import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { AppointmentCancelledByEmployeeVariables } from './appointment-cancelled-by-employee.type';
import AppointmentCancelledByEmployeeEmailTemplate from '../appointment-cancelled/email.template';

@Injectable()
export class AppointmentCancelledByEmployeeTemplate implements NotificationTemplate {
  type = 'appointment.cancelled.by_employee';

  build(channel: NotificationChannel, variables: AppointmentCancelledByEmployeeVariables) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: AppointmentCancelledByEmployeeVariables): BuildEmailResponse {
    return {
      subject: `Cita cancelada - para el ${variables.date}`,
      react: AppointmentCancelledByEmployeeEmailTemplate(variables),
    };
  }
}
