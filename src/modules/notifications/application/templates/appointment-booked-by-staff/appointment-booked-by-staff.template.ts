import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { AppointmentBookedByStaffVariables } from './appointment-booked-by-staff.type';
import { AppointmentBookedByStaffEmail } from './email.template';
import { NotImplementedError } from 'src/modules/notifications/errors/not-implemented.error';

@Injectable()
export class AppointmentBookedByStaffTemplate implements NotificationTemplate {
  type = 'appointment.booked.by_staff';

  build(channel: NotificationChannel, variables: AppointmentBookedByStaffVariables) {
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

  private buildEmail(variables: AppointmentBookedByStaffVariables): BuildEmailResponse {
    return {
      subject: `Cita reservada - para el ${variables.date}`,
      react: AppointmentBookedByStaffEmail(variables),
    };
  }
}
