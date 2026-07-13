import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentReminderVariables } from './appointment-reminder.type';
import { AppointmentReminderEmailTemplate } from './email.template';
import { NotImplementedError } from 'src/modules/notifications/errors/not-implemented.error';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';

@Injectable()
export class AppointmentReminderTemplate implements NotificationTemplate {
  type = 'appointment.reminder';

  build(channel: NotificationChannel, variables: any): any {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        return this.buildWhatsapp(variables);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: AppointmentReminderVariables): BuildEmailResponse {
    return {
      subject: `Recordatorio de cita para el ${variables.date} a las ${variables.time}`,
      react: AppointmentReminderEmailTemplate(variables),
    };
  }

  private buildWhatsapp(variables: any): any {
    throw new NotImplementedError();
  }
}
