import { appointmentLink } from '../_components/appointment-links';
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
    const subject = (variables.audience ? variables.audience === 'CUSTOMER' : variables.createdBy === 'STAFF')
      ? `Cita registrada · ${variables.date} a las ${variables.time}`
      : `Nueva cita para el ${variables.date} a las ${variables.time}`;

    return {
      subject,
      react: AppointmentCreatedEmailTemplate(variables),
    };
  }

  private buildInApp(variables: AppointmentCreatedVariables): BuildInAppResponse {
    if (variables.audience ? variables.audience === 'CUSTOMER' : variables.createdBy === 'STAFF') {
      return {
        title: 'Cita registrada',
        message: `Tu cita con ${variables.professionalName} quedó registrada para el ${variables.date} a las ${variables.time}`,
        actionUrl: variables.rescheduleUrl ?? `/appointments/${variables.appointmentId}`,
        actionLabel: 'Gestionar cita',
        action: { version: 1, kind: 'APPOINTMENT', appointmentId: variables.appointmentId },
      };
    }

    return {
      title: 'Cita registrada',
      message: `El cliente ${variables.customerName} registró una cita para el ${variables.date} a las ${variables.time}`,
      actionUrl: variables.detailsUrl ?? `/appointments/${variables.appointmentId}`,
      actionLabel: 'Ver cita',
      action: { version: 1, kind: 'APPOINTMENT', appointmentId: variables.appointmentId },
    };
  }

  private buildWhatsapp(variables: AppointmentCreatedVariables): BuildWhatsappResponse {
    const body = (variables.audience ? variables.audience === 'CUSTOMER' : variables.createdBy === 'STAFF')
      ? `Hola ${variables.customerName}. Tu cita con ${variables.professionalName} quedó registrada por ${variables.serviceName} el ${variables.date} a las ${variables.time}.`
      : `Nueva cita: ${variables.customerName} registró ${variables.serviceName} con ${variables.professionalName} el ${variables.date} a las ${variables.time}.`;

    return {
      body:
        body +
        appointmentLink(
          (variables.audience ? variables.audience === 'CUSTOMER' : variables.createdBy === 'STAFF') ? 'Ver mi cita' : 'Ver cita',
          variables.detailsUrl,
        ),
    };
  }
}
