import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { AppointmentCancelledByStaffVariables } from './appointment-cancelled-by-staff.type';
import AppointmentCancelledByStaffEmailTemplate from '../appointment-cancelled/email.template';

@Injectable()
export class AppointmentCancelledByStaffTemplate implements NotificationTemplate {
  type = 'appointment.cancelled.by_staff';

  build(channel: NotificationChannel, variables: AppointmentCancelledByStaffVariables) {
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

  private buildEmail(variables: AppointmentCancelledByStaffVariables): BuildEmailResponse {
    return {
      subject: `Cita cancelada - para el ${variables.date}`,
      react: AppointmentCancelledByStaffEmailTemplate(variables),
    };
  }
}
