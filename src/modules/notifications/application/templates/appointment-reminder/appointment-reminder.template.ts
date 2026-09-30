import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentReminderVariables } from './appointment-reminder.type';
import { AppointmentReminderEmailTemplate } from './email.template';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildWhatsappResponse } from 'src/modules/notifications/domain/templates/build-whatsapp.interface';

@Injectable()
export class AppointmentReminderTemplate implements NotificationTemplate {
  type = 'appointment.reminder';

  build(channel: NotificationChannel, variables: AppointmentReminderVariables) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        return this.buildWhatsapp(variables);
      default:
        throw new Error('Unknown channel');
    }
  }

  private buildEmail(variables: AppointmentReminderVariables): BuildEmailResponse {
    return {
      subject: `Recordatorio de cita para el ${variables.date} a las ${variables.time}`,
      react: AppointmentReminderEmailTemplate(variables),
    };
  }

  private buildWhatsapp(variables: AppointmentReminderVariables): BuildWhatsappResponse {
    const timing = variables.reminderType === '24h' ? 'manana' : 'en 2 horas';

    return {
      body:
        `Hola ${variables.customerName}. Te recordamos que tienes una cita ${timing} con ${variables.professionalName} ` +
        `por ${variables.serviceName}, el ${variables.date} a las ${variables.time}. ` +
        `Cancelar: ${variables.cancelUrl}. Reprogramar: ${variables.rescheduleUrl}.`,
    };
  }
}
