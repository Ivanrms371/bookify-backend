import { Injectable } from '@nestjs/common';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { BuildInAppResponse } from '../../domain/templates/build-in-app.interface';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from '../../domain/templates/notification-template.interface';
import { AppointmentCreatedTemplate } from '../templates/appointment-created/appointment-created.template';
import { AppointmentReminderTemplate } from '../templates/appointment-reminder/appointment-reminder.template';
import { VerificationEmailTemplate } from '../templates/confirm-email/confirm-email.template';
import { AppointmentCancelledTemplate } from '../templates/appointment-cancelled/appointment-cancelled.template';
import { AppointmentRescheduledTemplate } from '../templates/appointment-reschedule/appointment-reschedule.template';
import { TenantCreatedTemplate } from '../templates/tenant-created/tenant-created.template';
import { AppointmentBookedByStaffTemplate } from '../templates/appointment-booked-by-staff/appointment-booked-by-staff.template';
import { AppointmentCancelledByStaffTemplate } from '../templates/appointment-cancelled-by-staff/appointment-cancelled-by-staff.template';

@Injectable()
export class TemplateService {
  private templateMap = new Map<string, NotificationTemplate>();

  constructor(
    private readonly appointmentCreatedTemplate: AppointmentCreatedTemplate,
    private readonly appointmentCancelledTemplate: AppointmentCancelledTemplate,
    private readonly appointmentRescheduledTemplate: AppointmentRescheduledTemplate,
    private readonly appointmentReminderTemplate: AppointmentReminderTemplate,
    private readonly verificationEmailTemplate: VerificationEmailTemplate,
    private readonly tenantCreatedTemplate: TenantCreatedTemplate,
    private readonly appointmentBookedByStaffTemplate: AppointmentBookedByStaffTemplate,
    private readonly appointmentCancelledByStaffTemplate: AppointmentCancelledByStaffTemplate,
  ) {
    this.templateMap.set(this.appointmentCreatedTemplate.type, this.appointmentCreatedTemplate);
    this.templateMap.set(this.appointmentCancelledTemplate.type, this.appointmentCancelledTemplate);
    this.templateMap.set(this.appointmentRescheduledTemplate.type, this.appointmentRescheduledTemplate);
    this.templateMap.set(this.appointmentReminderTemplate.type, this.appointmentReminderTemplate);
    this.templateMap.set(this.verificationEmailTemplate.type, this.verificationEmailTemplate);
    this.templateMap.set(this.tenantCreatedTemplate.type, this.tenantCreatedTemplate);
    this.templateMap.set(this.appointmentBookedByStaffTemplate.type, this.appointmentBookedByStaffTemplate);
    this.templateMap.set(this.appointmentCancelledByStaffTemplate.type, this.appointmentCancelledByStaffTemplate);
  }

  build(type: string, channel: NotificationChannel, variables: any): BuildEmailResponse | BuildInAppResponse | BuildWhatsappResponse {
    const template = this.templateMap.get(type);
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }
    return template.build(channel, variables);
  }
}
