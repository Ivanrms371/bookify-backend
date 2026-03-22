import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentCreatedVariables } from './appointment-created.type';
import { AppointmentCreatedEmailTemplate } from './email.template';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';

@Injectable()
export class AppointmentCreatedTemplate implements NotificationTemplate {
  type = 'appointment.created';

  build(channel: NotificationChannel, variables: AppointmentCreatedVariables) {
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

  private buildEmail(variables: AppointmentCreatedVariables): BuildEmailResponse {
    return {
      subject: `Nueva cita para el ${variables.date} a las ${variables.time}`,
      react: AppointmentCreatedEmailTemplate(variables),
    };
  }

  private buildInApp(variables: AppointmentCreatedVariables): BuildInAppResponse {
    return {
      title: 'Nueva cita programada',
      message: `El cliente ${variables.customerName} ha programado una cita para el ${variables.date} a las ${variables.time}`,
      actionUrl: `/appointments/${variables.appointmentId}`,
    };
  }
}
