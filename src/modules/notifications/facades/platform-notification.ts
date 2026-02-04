import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../core/notifications.service';
import { SchedulerService } from '../scheduled/scheduler.service';
import {
  SendAccountConfirmationDto,
  SendPasswordResetDto,
  SendPlanExpiringReminderDto,
  SendWelcomeDto,
} from '../types/platform-notifications.interfaces';
import { NotificationChannel, NotificationType } from 'src/generated/prisma/enums';

@Injectable()
export class PlatformNotifications {
  constructor(
    private notifications: NotificationsService,
    private scheduler: SchedulerService,
  ) {}

  async sendAccountConfirmation({ userId, name, email, token }: SendAccountConfirmationDto) {
    return this.notifications.send({
      userId,
      channel: NotificationChannel.EMAIL,
      type: NotificationType.ACCOUNT_CONFIRMATION,
      contact: { email },
      content: {
        template: 'account-confirmation',
        variables: { name, confirmLink: `${process.env.APP_URL}/confirm/${token}` },
      },
    });
  }

  async sendWelcome({ userId, email, name }: SendWelcomeDto) {
    return this.notifications.send({
      userId,
      channel: NotificationChannel.EMAIL,
      type: NotificationType.WELCOME,
      contact: { email },
      content: { template: 'welcome', variables: { name } },
    });
  }

  async schedulePlanExpiringReminder({
    userId,
    businessId,
    ownerEmail,
    businessName,
    expirationDate,
  }: SendPlanExpiringReminderDto) {
    return this.scheduler.schedulePlanExpiringReminder(
      userId,
      businessId,
      ownerEmail,
      businessName,
      expirationDate,
    );
  }

  async sendPasswordReset({ userId, name, email, token }: SendPasswordResetDto) {
    return this.notifications.send({
      userId,
      channel: NotificationChannel.EMAIL,
      type: NotificationType.PASSWORD_RESET,
      contact: { email },
      content: {
        template: 'password-reset',
        variables: { name, resetLink: `${process.env.APP_URL}/reset/${token}` },
      },
    });
  }
}
