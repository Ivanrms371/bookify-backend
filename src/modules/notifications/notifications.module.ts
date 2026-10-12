import { CustomerVerificationTemplate } from './application/templates/customer-verification/customer-verification.template';

import { NotificationFinalizationService } from './application/services/notification-finalization.service';
import { NotificationReconciliationService } from './application/services/notification-reconciliation.service';
import { NotificationReconciliationRepository } from './infraestructure/repositories/notification-reconciliation.repository';
import { NotificationReconciliationScheduler } from './schedulers/notification-reconciliation.scheduler';
import { InvitationAcceptedListener } from './listeners/invitations/invitation-accepted.listener';
import { VerificationPhoneTemplate } from './application/templates/confirm-phone/confirm-phone.template';
import { MemberJoinedTemplate } from './application/templates/member-joined/member-joined.template';
import { TenantCreatedListener } from './listeners/tenants/tenant-created.listener';
import {
  TrialEnds7dTemplate,
  TrialEnds3dTemplate,
  Renewal3dTemplate,
} from './application/templates/billing-notice/billing-notice.template';
import { ProfessionalDayEndTemplate } from './application/templates/professional-day-end/professional-day-end.template';
import { ProfessionalDayStartTemplate } from './application/templates/professional-day-start/professional-day-start.template';
import { MembershipsModule } from '../memberships/memberships.module';
import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/users.module';
import { TenantUsageModule } from 'src/modules/tenants/features/usage/tenant-usage.module';
import { NotificationsService } from './application/services/notifications.service';
import { NotificationDeliveryRepository } from './infraestructure/repositories/notification-delivery.repository';
import { NotificationLogsRepository } from './infraestructure/repositories/notification-logs.repository';
import { NotificationsRepository } from './infraestructure/repositories/notifications.repository';
import { TemplateService } from './application/services/template.service';
import { EmailGateway } from './infraestructure/gateways/email.gateway';
import { WhatsappGateway } from './infraestructure/gateways/whatsapp.gateway';
import { NotificationGatewaysService } from './infraestructure/gateways/notification-gateways.service';
import { NotificationProcessorService } from './application/services/notification-processor.service';
import { NotificationScheduler } from './schedulers/notification-scheduler.service';
import { NotificationConfigService } from './notification-config.service';
import { InAppNotificationsRepository } from './infraestructure/repositories/in-app-notifications.repository';
import { NotificationsListener } from './notifications.listener';
import { NotificationUsageService } from './application/services/notification-usage.service';
import { AppointmentCreatedTemplate } from './application/templates/appointment-created/appointment-created.template';
import { AppointmentReminderTemplate } from './application/templates/appointment-reminder/appointment-reminder.template';
import { VerificationCreatedListener } from './listeners/verifications/verification-created.listener';
import { VerificationEmailTemplate } from './application/templates/confirm-email/confirm-email.template';
import { AppointmentCancelledTemplate } from './application/templates/appointment-cancelled/appointment-cancelled.template';
import { AppointmentRescheduledTemplate } from './application/templates/appointment-reschedule/appointment-reschedule.template';
import { AppointmentCreatedListener } from './listeners/appointments/appointment-created.listener';
import { AppointmentCancelledListener } from './listeners/appointments/appointment-cancelled.listener';
import { AppointmentFinishedListener } from './listeners/appointments/appointment-finished.listener';
import { AppointmentRescheduledListener } from './listeners/appointments/appointment-rescheduled.listener';
import { NotificationsController } from './notifications.controller';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';
import { NotificationsWsGateway } from './infraestructure/gateways/notifications.ws.gateway';
import { TenantCreatedTemplate } from './application/templates/tenant-created/tenant-created.template';
import { CustomersModule } from '../customers/customers.module';
import { InvitationCreatedListener } from './listeners/invitations/invitation-created.listener';
import { InvitationCreatedTemplate } from './application/templates/invitation-created/invitation-created.template';
import { AppointmentNotificationRepository } from './infraestructure/repositories/appointment-notification.repository';
import { NotificationRecipientResolver } from './application/services/notification-recipient-resolver.service';

@Module({
  imports: [MembershipsModule, TenantUsageModule, UsersModule, CustomersModule],
  controllers: [NotificationsController],
  exports: [NotificationsService],
  providers: [
    NotificationFinalizationService,
    NotificationReconciliationService,
    NotificationReconciliationRepository,
    NotificationReconciliationScheduler,
    InvitationAcceptedListener,
    MemberJoinedTemplate,
    VerificationPhoneTemplate,
    CustomerVerificationTemplate,
    TrialEnds7dTemplate,
    TrialEnds3dTemplate,
    Renewal3dTemplate,
    ProfessionalDayStartTemplate,
    ProfessionalDayEndTemplate,
    // Services
    NotificationsService,
    AppointmentNotificationRepository,
    NotificationProcessorService,
    NotificationUsageService,
    NotificationRecipientResolver,
    InAppNotificationsService,

    // Main Listener
    NotificationsListener,

    // Gateways
    NotificationGatewaysService,
    EmailGateway,
    WhatsappGateway,
    NotificationsWsGateway,

    // Repositories
    InAppNotificationsRepository,
    NotificationDeliveryRepository,
    NotificationsRepository,
    NotificationLogsRepository,

    // Config
    NotificationConfigService,

    // Schedulers
    NotificationScheduler,

    // Templates
    TemplateService,
    AppointmentCreatedTemplate,
    AppointmentCancelledTemplate,
    AppointmentRescheduledTemplate,
    AppointmentReminderTemplate,
    VerificationEmailTemplate,
    TenantCreatedTemplate,
    InvitationCreatedTemplate,

    // Listeners
    AppointmentCreatedListener,
    AppointmentCancelledListener,
    AppointmentFinishedListener,
    AppointmentRescheduledListener,
    VerificationCreatedListener,
    TenantCreatedListener,
    InvitationCreatedListener,
  ],
})
export class NotificationsModule {}
