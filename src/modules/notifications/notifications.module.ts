import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/users.module';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { BusinessQuotaModule } from 'src/modules/businesses/features/quota/business-quota.module';
import { NotificationsService } from './application/services/notifications.service';
import { NotificationDeliveryRepository } from './infraestructure/repositories/notification-delivery.repository';
import { NotificationLogsRepository } from './infraestructure/repositories/notification-logs.repository';
import { NotificationsRepository } from './infraestructure/repositories/notifications.repository';
import { TemplateService } from './application/services/template.service';
import { EmailGateway } from './infraestructure/gateways/email.gateway';
import { WhatsappGateway } from './infraestructure/gateways/whatsapp.gateway';
import { NotificationGatewaysService } from './infraestructure/gateways/notification-gateways.service';
import { InAppGateway } from './infraestructure/gateways/in-app.gateway';
import { NotificationProcessorService } from './application/services/notification-processor.service';
import { NotificationScheduler } from './schedulers/notification-scheduler.service';
import { NotificationConfigService } from './notification-config.service';
import { InAppNotificationsRepository } from './infraestructure/repositories/in-app-notifications.repository';
import { AppointmentCreatedListener } from './listeners/appointments/appointment-created.listener';
import { NotificationsListener } from './notifications.listener';
import { NotificationUsageService } from './application/services/notification-usage.service';
import { AppointmentCreatedTemplate } from './application/templates/appointment-created/appointment-created.template';
import { AppointmentReminderTemplate } from './application/templates/appointment-reminder/appointment-reminder.template';
import { VerificationCreatedListener } from './listeners/verifications/verification-created.listener';
import { VerificationEmailTemplate } from './application/templates/confirm-email/confirm-email.template';
import { AppointmentCancelledTemplate } from './application/templates/appointment-cancelled/appointment-cancelled.template';
import { AppointmentRescheduledTemplate } from './application/templates/appointment-reschedule/appointment-reschedule.template';
import { AppointmentCancelledListener } from './listeners/appointments/appointment-cancelled.listener';
import { AppointmentRescheduledListener } from './listeners/appointments/appointment-rescheduled.listener';
import { NotificationsController } from './notifications.controller';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';

@Module({
  imports: [BusinessQuotaModule, UsersModule, CustomersModule],
  controllers: [NotificationsController],
  providers: [
    // Services
    NotificationsService,
    NotificationProcessorService,
    NotificationUsageService,
    InAppNotificationsService,

    // Main Listener
    NotificationsListener,

    // Gateways
    NotificationGatewaysService,
    EmailGateway,
    WhatsappGateway,
    InAppGateway,

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

    // Listeners
    AppointmentCreatedListener,
    AppointmentCancelledListener,
    AppointmentRescheduledListener,
    VerificationCreatedListener,
  ],
})
export class NotificationsModule {}
