import { appointmentLink } from '../_components/appointment-links';
import { Injectable } from '@nestjs/common';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentRescheduledVariables } from './appointment-reschedule.type';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';
import { AppointmentRescheduleEmailTemplate } from './email.template';
import { BuildWhatsappResponse } from 'src/modules/notifications/domain/templates/build-whatsapp.interface';

@Injectable()
export class AppointmentRescheduledTemplate implements NotificationTemplate {
  type = 'appointment.rescheduled';

  build(channel: NotificationChannel, variables: AppointmentRescheduledVariables) {
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

  private buildEmail(variables: AppointmentRescheduledVariables): BuildEmailResponse {
    return {
      subject: `Cita reprogramada - ${variables.date} a las ${variables.time}`,
      react: AppointmentRescheduleEmailTemplate(variables),
    };
  }

  private buildInApp(variables: AppointmentRescheduledVariables): BuildInAppResponse {
    const professional = variables.audience ? variables.audience === 'PROFESSIONAL' : variables.rescheduledBy === RecipientType.CUSTOMER;
    return {
      title: 'Cita reprogramada',
      message: `La cita con ${professional ? variables.customerName : variables.professionalName} fue reprogramada para el ${variables.date} a las ${variables.time}`,
      actionUrl: `/appointments/${variables.appointmentId}`,
      actionLabel: 'Ver cita actualizada',
      action: { version: 1, kind: 'APPOINTMENT', appointmentId: variables.appointmentId },
    };
  }

  private buildWhatsapp(variables: AppointmentRescheduledVariables): BuildWhatsappResponse {
    const professional = variables.audience ? variables.audience === 'PROFESSIONAL' : variables.rescheduledBy === RecipientType.CUSTOMER;
    const previous =
      variables.previousDate && variables.previousTime ? ` Antes era el ${variables.previousDate} a las ${variables.previousTime}.` : '';
    const reason = variables.rescheduleReason ? ` Motivo: ${variables.rescheduleReason}.` : '';

    return {
      body:
        (professional
          ? `Hola ${variables.professionalName}. La cita de ${variables.serviceName} con ${variables.customerName} `
          : `Hola ${variables.customerName}. Tu cita de ${variables.serviceName} con ${variables.professionalName} `) +
        `fue reprogramada para el ${variables.date} a las ${variables.time}.${previous}${reason}` +
        appointmentLink(professional ? 'Ver cita' : 'Ver mi cita', variables.detailsUrl),
    };
  }
}
