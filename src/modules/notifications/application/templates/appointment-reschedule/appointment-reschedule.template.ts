import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentRescheduleVariables } from './appointment-reschedule.type';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { BuildInAppResponse } from 'src/modules/notifications/domain/templates/build-in-app.interface';

@Injectable()
export class AppointmentRescheduleTemplate implements NotificationTemplate {
  type = 'appointment.cancelled';

  build(channel: NotificationChannel, variables: AppointmentRescheduleVariables) {
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

  private buildEmail(variables: AppointmentRescheduleVariables): BuildEmailResponse {
    throw new Error('Not implemented');
  }

  private buildInApp(variables: AppointmentRescheduleVariables): BuildInAppResponse {
    throw new Error('Not implemented');
  }
}
