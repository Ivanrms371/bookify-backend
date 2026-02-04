import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessLimitsRepository } from './analytics/repositories/business-limits.repository';
import { NotificationAnalyticsRepository } from './analytics/repositories/notification-analytics.repository';
import { NotificationLogRepository } from './analytics/repositories/notification-log.repository';
import { NotificationAnalyticsService } from './analytics/notification-analytics.service';
import { NotificationsService } from './core/notifications.service';
import { EmailService } from './core/emails/services/email.service';
import { LimitTrackerService } from './core/limit-tracker.service';
import { WhatsappService } from './core/whatsapp.service';
import { BusinessNotifications } from './facades/business-notification';
import { PlatformNotifications } from './facades/platform-notification';
import { ScheduledNotificationRepository } from './scheduled/repositories/scheduled-notification.repository';
import { ScheduledProcessorCron } from './scheduled/scheduled-processor.cron';
import { SchedulerService } from './scheduled/scheduler.service';
import { TemplateResolver } from './core/resolvers/template.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    // Analytics
    NotificationAnalyticsService,
    NotificationAnalyticsRepository,
    NotificationLogRepository,
    BusinessLimitsRepository,

    // Core
    NotificationsService,
    EmailService,
    TemplateResolver,
    WhatsappService,
    LimitTrackerService,

    // Facades
    BusinessNotifications,
    PlatformNotifications,

    // Scheduled
    ScheduledNotificationRepository,
    ScheduledProcessorCron,
    SchedulerService,
  ],
  exports: [BusinessNotifications, PlatformNotifications],
})
export class NotificationModule {}
