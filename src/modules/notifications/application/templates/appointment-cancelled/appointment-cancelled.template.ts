import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentCancelledVariables } from './appointment-cancelled.type';
import { AppointmentCancelledEmailTemplate } from './email.template';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';

@Injectable()
export class AppointmentCancelledTemplate implements NotificationTemplate {
  type = 'appointment.cancelled';

  build(channel: NotificationChannel, variables: AppointmentCancelledVariables) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        return this.buildInApp(variables);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: AppointmentCancelledVariables): BuildEmailResponse {
    return {
      subject: `Cita cancelada - para el ${variables.date}`,
      react: AppointmentCancelledEmailTemplate(variables),
    };
  }

  private buildInApp(variables: AppointmentCancelledVariables): BuildInAppResponse {
    return {
      title: 'Cita cancelada',
      message: `Tu cita con ${variables.employeeName} para el ${variables.date} ha sido cancelada`,
      actionUrl: `/appointments/${variables.appointmentId}`,
    };
  }
}
