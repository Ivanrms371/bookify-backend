import { Injectable, Logger } from '@nestjs/common';
import { ScheduledNotificationRepository } from './repositories/scheduled-notification.repository';
import {
  ScheduleAppointmentReminder24hDto,
  ScheduleAppointmentReminder2hDto,
  SchedulePostAppointmentThankYouDto,
} from '../types/business-notification.interfaces';
import { NotificationLayer, NotificationType } from 'src/generated/prisma/enums';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly scheduledRepo: ScheduledNotificationRepository) {}

  async schedulePlanExpiringReminder(
    userId: string,
    businessId: string,
    ownerEmail: string,
    businessName: string,
    expirationDate: Date,
  ) {
    const reminderDate = new Date(expirationDate);
    reminderDate.setDate(reminderDate.getDate() - 7);

    await this.scheduledRepo.create({
      user: { connect: { id: userId } },
      type: NotificationType.PLAN_EXPIRES_7D,
      layer: NotificationLayer.PLATFORM,
      recipientEmail: ownerEmail,
      scheduledFor: reminderDate,
      templateVariables: {
        businessName,
        daysLeft: 7,
        expirationDate: expirationDate.toISOString(),
      },
      status: 'PENDING',
    });

    this.logger.log(`📅 Scheduled plan expiring reminder for business ${businessId}`);
  }

  async scheduleAppointmentReminder24h({
    userId,
    appointmentId,
    businessId,
    customerPhone,
    customerEmail,
    appointmentData,
  }: ScheduleAppointmentReminder24hDto) {
    const appointmentDate = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setHours(reminderDate.getHours() - 24);

    if (reminderDate < new Date()) {
      this.logger.warn(`Cannot schedule past reminder for appointment ${appointmentId}`);
      return;
    }

    await this.scheduledRepo.create({
      user: { connect: { id: userId } },
      appointment: { connect: { id: appointmentId } },
      business: { connect: { id: businessId } },
      type: NotificationType.APPOINTMENT_REMINDER_24H,
      layer: NotificationLayer.BUSINESS,
      recipientEmail: customerEmail,
      recipientPhone: customerPhone,
      scheduledFor: reminderDate,
      templateVariables: {
        customerName: appointmentData.customerName,
        date: appointmentData.date,
        time: appointmentData.time,
        businessName: appointmentData.businessName,
      },
      status: 'PENDING',
    });
    this.logger.log(`📅 Scheduled 24h reminder for business ${businessId}`);
  }

  async scheduleAppointmentReminder2h({
    userId,
    appointmentId,
    businessId,
    customerPhone,
    customerEmail,
    appointmentData,
  }: ScheduleAppointmentReminder2hDto) {
    const appointmentDate = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setHours(reminderDate.getHours() - 2);

    if (reminderDate < new Date()) {
      this.logger.warn(`Cannot schedule past reminder for appointment ${appointmentId}`);
      return;
    }

    await this.scheduledRepo.create({
      user: { connect: { id: userId } },
      appointment: { connect: { id: appointmentId } },
      business: { connect: { id: businessId } },
      type: NotificationType.APPOINTMENT_REMINDER_2H,
      layer: NotificationLayer.BUSINESS,
      recipientEmail: customerEmail,
      recipientPhone: customerPhone,
      scheduledFor: reminderDate,
      templateVariables: {
        customerName: appointmentData.customerName,
        businessName: appointmentData.businessName,
        date: appointmentData.date,
        time: appointmentData.time,
      },
      status: 'PENDING',
    });
    this.logger.log(`📅 Scheduled 2h  reminder for business ${businessId}`);
  }

  async schedulePostAppointmentThankYou({
    appointmentId,
    businessId,
    customerPhone,
    customerEmail,
    appointmentData,
  }: SchedulePostAppointmentThankYouDto) {
    const appointmentDate = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setHours(reminderDate.getHours() + 2); // 2 hours after

    await this.scheduledRepo.create({
      appointment: { connect: { id: appointmentId } },
      business: { connect: { id: businessId } },
      type: NotificationType.POST_APPOINTMENT_THANKYOU,
      layer: NotificationLayer.BUSINESS,
      recipientEmail: customerEmail,
      recipientPhone: customerPhone,
      scheduledFor: reminderDate,
      templateVariables: {
        customerName: appointmentData.customerName,
        businessName: appointmentData.businessName,
        date: appointmentData.date,
        time: appointmentData.time,
      },
      status: 'PENDING',
    });
    this.logger.log(`📅 Scheduled 2h  reminder for business ${businessId}`);
  }

  async cancelAppointmentReminders(appointmentId: string) {
    const count = await this.scheduledRepo.cancelByAppointment(appointmentId);
    this.logger.log(`🗑️ Cancelled ${count} reminders for appointment ${appointmentId}`);
  }
}
