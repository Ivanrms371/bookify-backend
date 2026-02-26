import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentRescheduledVariables } from './appointment-reschedule.type';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';

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
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: AppointmentRescheduledVariables): BuildEmailResponse {
    throw new Error('Not implemented');
  }

  private buildInApp(variables: AppointmentRescheduledVariables): BuildInAppResponse {
    throw new Error('Not implemented');
  }
}
