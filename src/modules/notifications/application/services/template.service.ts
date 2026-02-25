import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from '../../domain/templates/notification-template.interface';
import { AppointmentCreatedTemplate } from '../templates/appointment-created/appointment-created.template';
import { AppointmentReminderTemplate } from '../templates/appointment-reminder/appointment-reminder.template';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { VerificationEmailTemplate } from '../templates/confirm-email/confirm-email.template';

@Injectable()
export class TemplateService {
  private templateMap = new Map<string, NotificationTemplate>();

  constructor(
    private readonly appointmentCreatedTemplate: AppointmentCreatedTemplate,
    private readonly appointmentReminderTemplate: AppointmentReminderTemplate,
    private readonly verificationEmailTemplate: VerificationEmailTemplate,
  ) {
    this.templateMap.set(this.appointmentCreatedTemplate.type, this.appointmentCreatedTemplate);
    this.templateMap.set(this.appointmentReminderTemplate.type, this.appointmentReminderTemplate);
    this.templateMap.set(this.verificationEmailTemplate.type, this.verificationEmailTemplate);
  }

  build(type: string, channel: NotificationChannel, variables: any): BuildEmailResponse | BuildInAppResponse | BuildWhatsappResponse {
    const template = this.templateMap.get(type);
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }
    return template.build(channel, variables);
  }
}
