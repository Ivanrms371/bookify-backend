import { CustomerVerificationTemplate } from '../templates/customer-verification/customer-verification.template';
import { VerificationPhoneTemplate } from '../templates/confirm-phone/confirm-phone.template';
import { MemberJoinedTemplate } from '../templates/member-joined/member-joined.template';
import { TrialEnds7dTemplate, TrialEnds3dTemplate, Renewal3dTemplate } from '../templates/billing-notice/billing-notice.template';
import { ProfessionalDayEndTemplate } from '../templates/professional-day-end/professional-day-end.template';
import { ProfessionalDayStartTemplate } from '../templates/professional-day-start/professional-day-start.template';
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
import { InvitationCreatedTemplate } from '../templates/invitation-created/invitation-created.template';

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
    private readonly membershipInvitedTemplate: InvitationCreatedTemplate,
    private readonly professionalDayStartTemplate: ProfessionalDayStartTemplate,
    private readonly professionalDayEndTemplate: ProfessionalDayEndTemplate,
    memberJoined: MemberJoinedTemplate,
    trial7: TrialEnds7dTemplate,
    trial3: TrialEnds3dTemplate,
    renewal: Renewal3dTemplate,
    phone: VerificationPhoneTemplate,
    customer: CustomerVerificationTemplate,
  ) {
    for (const template of [customer, phone, memberJoined, trial7, trial3, renewal]) this.templateMap.set(template.type, template);
    this.templateMap.set(this.professionalDayEndTemplate.type, this.professionalDayEndTemplate);
    this.templateMap.set(this.professionalDayStartTemplate.type, this.professionalDayStartTemplate);
    this.templateMap.set(this.appointmentCreatedTemplate.type, this.appointmentCreatedTemplate);
    this.templateMap.set(this.appointmentCancelledTemplate.type, this.appointmentCancelledTemplate);
    this.templateMap.set(this.appointmentRescheduledTemplate.type, this.appointmentRescheduledTemplate);
    this.templateMap.set(this.appointmentReminderTemplate.type, this.appointmentReminderTemplate);
    this.templateMap.set(this.verificationEmailTemplate.type, this.verificationEmailTemplate);
    this.templateMap.set(this.tenantCreatedTemplate.type, this.tenantCreatedTemplate);
    this.templateMap.set(this.membershipInvitedTemplate.type, this.membershipInvitedTemplate);
  }

  build(type: string, channel: NotificationChannel, variables: any): BuildEmailResponse | BuildInAppResponse | BuildWhatsappResponse {
    const template = this.templateMap.get(type);
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }
    return template.build(channel, variables);
  }
}
