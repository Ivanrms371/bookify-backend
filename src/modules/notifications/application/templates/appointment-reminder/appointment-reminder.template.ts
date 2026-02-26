import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { AppointmentReminderVariables } from './appointment-reminder.type';
import { AppointmentReminderEmailTemplate } from './email.template';
import { NotImplementedError } from 'src/modules/notifications/errors/not-implemented.error';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';
import { AppointmentCancelationService } from 'src/modules/appointments/application/services/appointment-cancelation.service';
import { AppointmentReschedulingService } from 'src/modules/appointments/application/services/appointment-rescheduling.service';

@Injectable()
export class AppointmentReminderTemplate implements NotificationTemplate {
  type = 'appointment.reminder';

  constructor(
    private readonly appointmentCancelationService: AppointmentCancelationService,
    private readonly appointmentReschedulingService: AppointmentReschedulingService,
  ) {}

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

  private async buildEmail(variables: AppointmentReminderVariables): Promise<BuildEmailResponse> {
    const cancelUrl = await this.appointmentCancelationService.generateCancelUrl(variables.appointmentId);
    const rescheduleUrl = await this.appointmentReschedulingService.generateRescheduleUrl(variables.appointmentId);
    return {
      subject: `Nueva cita para el ${variables.date} a las ${variables.time}`,
      react: AppointmentReminderEmailTemplate({
        ...variables,
        cancelUrl,
        rescheduleUrl,
      }),
    };
  }

  private buildWhatsapp(variables: any): any {
    throw new NotImplementedError();
  }
}
