import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentCreatedVariables } from './appointment-created.type';
import { AppointmentCreatedEmailTemplate } from './email.template';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';
import { BuildWhatsappResponse } from 'src/modules/notifications/domain/templates/build-whatsapp.interface';

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
        return this.buildWhatsapp(variables);
      default:
        throw new Error('Unknown channel');
    }
  }

  private buildEmail(variables: AppointmentCreatedVariables): BuildEmailResponse {
    const subject =
      variables.createdBy === 'STAFF'
        ? `Nueva cita con ${variables.professionalName} para el ${variables.date} a las ${variables.time}`
        : `Nueva cita para el ${variables.date} a las ${variables.time}`;

    return {
      subject,
      react: AppointmentCreatedEmailTemplate(variables),
    };
  }

  private buildInApp(variables: AppointmentCreatedVariables): BuildInAppResponse {
    if (variables.createdBy === 'STAFF') {
      return {
        title: 'Nueva cita programada',
        message: `${variables.professionalName} ha programado una cita para ti el ${variables.date} a las ${variables.time}`,
        actionUrl: variables.rescheduleUrl,
      };
    }

    return {
      title: 'Nueva cita programada',
      message: `El cliente ${variables.customerName} ha programado una cita para el ${variables.date} a las ${variables.time}`,
      actionUrl: variables.detailsUrl ?? `/appointments/${variables.appointmentId}`,
    };
  }

  private buildWhatsapp(variables: AppointmentCreatedVariables): BuildWhatsappResponse {
    const body =
      variables.createdBy === 'STAFF'
        ? `Hola ${variables.customerName}. ${variables.professionalName} ha agendado una cita para ti por ${variables.serviceName} el ${variables.date} a las ${variables.time}.`
        : `Nueva cita: ${variables.customerName} agendo ${variables.serviceName} con ${variables.professionalName} el ${variables.date} a las ${variables.time}.`;

    return { body };
  }
}
