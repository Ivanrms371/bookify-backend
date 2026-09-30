import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentCancelledVariables } from './appointment-cancelled.type';
import { AppointmentCancelledEmailTemplate } from './email.template';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';
import { RecipientType } from 'src/generated/prisma/enums';
import { BuildWhatsappResponse } from 'src/modules/notifications/domain/templates/build-whatsapp.interface';

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
        return this.buildWhatsapp(variables);
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
    const cancelledByCustomer = variables.cancelledBy === RecipientType.CUSTOMER;

    return {
      title: 'Cita cancelada',
      message: cancelledByCustomer
        ? `${variables.customerName} canceló la cita para el ${variables.date}`
        : `Tu cita con ${variables.professionalName} para el ${variables.date} ha sido cancelada`,
      actionUrl: `/appointments/${variables.appointmentId}`,
    };
  }

  private buildWhatsapp(variables: AppointmentCancelledVariables): BuildWhatsappResponse {
    const cancelledByCustomer = variables.cancelledBy === RecipientType.CUSTOMER;
    const reason = variables.cancellationReason ? ` Motivo: ${variables.cancellationReason}.` : '';

    return {
      body: cancelledByCustomer
        ? `Cita cancelada: ${variables.customerName} cancelo la cita con ${variables.professionalName} del ${variables.date} a las ${variables.time}.${reason}`
        : `Hola ${variables.customerName}. Tu cita con ${variables.professionalName} del ${variables.date} a las ${variables.time} fue cancelada.${reason}`,
    };
  }
}
