// facades/business-notifications.facade.ts
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../core/notifications.service';
import { SchedulerService } from '../scheduled/scheduler.service';
import {
  ScheduleAppointmentReminderDto,
  SendAppointmentCancelledDto,
  SendAppointmentConfirmationDto,
  SendAuthOtpDto,
} from '../types/business-notification.interfaces';
import { NotificationChannel, NotificationType } from 'src/generated/prisma/enums';

@Injectable()
export class BusinessNotifications {
  constructor(
    private notifications: NotificationsService,
    private scheduler: SchedulerService,
  ) {}

  async sendAppointmentConfirmation({
    userId,
    businessId,
    phone,
    appointmentData,
  }: SendAppointmentConfirmationDto) {
    return this.notifications.send({
      userId,
      businessId,
      channel: NotificationChannel.WHATSAPP,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      contact: {
        phone,
      },
      content: {
        template: 'appointment-confirmation',
        variables: appointmentData,
      },
    });
  }

  async sendAppointmentCancelled({
    userId,
    businessId,
    phone,
    appointmentData,
  }: SendAppointmentCancelledDto) {
    return this.notifications.send({
      userId,
      businessId,
      channel: NotificationChannel.WHATSAPP,
      type: NotificationType.APPOINTMENT_CANCELLED,
      contact: {
        phone,
      },
      content: {
        template: 'appointment-cancelled',
        variables: appointmentData,
      },
    });
  }

  async sendAuthOTP({ userId, businessId, phone, code }: SendAuthOtpDto) {
    return this.notifications.send({
      userId,
      businessId,
      channel: NotificationChannel.WHATSAPP,
      type: NotificationType.AUTH_OTP,
      contact: {
        phone,
      },
      content: {
        template: 'auth-otp',
        variables: { code },
      },
    });
  }

  async scheduleAppointmentReminders(data: ScheduleAppointmentReminderDto) {
    await this.scheduler.scheduleAppointmentReminder24h(data);

    await this.scheduler.scheduleAppointmentReminder2h(data);

    await this.scheduler.schedulePostAppointmentThankYou(data);
  }

  async cancelAppointmentReminders(appointmentId: string) {
    return this.scheduler.cancelAppointmentReminders(appointmentId);
  }
}
