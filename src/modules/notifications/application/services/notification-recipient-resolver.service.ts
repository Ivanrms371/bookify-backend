import { customerDestination } from 'src/modules/verifications/domain/customer-verification-policy';
import { Injectable } from '@nestjs/common';
import type { Notification } from 'src/generated/prisma/client';
import { NotificationChannel, RecipientType } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';
import { CustomersService } from 'src/modules/customers/customers.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { DeliverySkippedError } from '../../errors/delivery-skipped.error';

@Injectable()
export class NotificationRecipientResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
    private readonly prisma: PrismaService,
  ) {}

  async resolve(channel: NotificationChannel, notification: Notification): Promise<string> {
    if (notification.recipientType === RecipientType.CUSTOMER && notification.type === 'customer.verification') {
      return this.resolveCustomerChallenge(channel, notification);
    }
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.resolveEmail(notification);
      case NotificationChannel.WHATSAPP:
        return this.resolvePhone(notification);
      case NotificationChannel.IN_APP:
        return this.resolveInAppUser(notification);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async resolveCustomerChallenge(channel: NotificationChannel, notification: Notification) {
    if (!notification.referenceId || !notification.tenantId) throw new DeliverySkippedError('Missing verification binding');
    if (channel !== 'EMAIL' && channel !== 'WHATSAPP') throw new DeliverySkippedError('Invalid OTP channel');
    const tenantId = notification.tenantId;
    return this.prisma.$transaction(async (tx) => {
      // Match the customer -> verification lock order of verification and contact edits.
      await tx.$queryRaw`SELECT id FROM customers WHERE id = ${notification.recipientId}::uuid AND tenant_id = ${notification.tenantId}::uuid FOR UPDATE`;
      const customer = await tx.customer.findFirst({ where: { id: notification.recipientId, tenantId, deletedAt: null, blockedAt: null } });
      await tx.$queryRaw`SELECT id FROM verifications WHERE id = ${notification.referenceId}::uuid FOR UPDATE`;
      const verification = await tx.verification.findUnique({ where: { id: notification.referenceId! } });
      if (
        !customer ||
        !verification ||
        verification.type !== (channel === 'EMAIL' ? 'CUSTOMER_VERIFICATION_EMAIL' : 'CUSTOMER_VERIFICATION_PHONE') ||
        verification.recipientType !== 'CUSTOMER' ||
        verification.recipientId !== customer.id ||
        verification.tenantId !== notification.tenantId ||
        verification.lockedAt ||
        verification.verifiedAt ||
        verification.expiresAt <= new Date()
      )
        throw new DeliverySkippedError('Inactive verification');
      const payload = notification.payload as { phone?: string; email?: string } | null;
      const snapshot = channel === 'EMAIL' ? payload?.email : payload?.phone;
      const current = customerDestination(customer, channel);
      if (!snapshot || (channel === 'EMAIL' && verification.contactWasMissing ? !!customer.email : current !== snapshot))
        throw new DeliverySkippedError('Verification contact changed');
      if (verification.channel !== channel || verification.destination !== snapshot)
        throw new DeliverySkippedError('Verification destination mismatch');
      return snapshot;
    });
  }

  private isProfessionalAppointment(notification: Notification) {
    return (
      notification.recipientType === RecipientType.PROFESSIONAL ||
      (notification.recipientType === RecipientType.USER &&
        ['appointment.created', 'appointment.rescheduled', 'appointment.cancelled'].includes(notification.type))
    );
  }

  private async findProfessional(notification: Notification) {
    if (!notification.tenantId) throw new DeliverySkippedError('Professional recipient requires a tenant');
    let professionalId = notification.recipientId;
    if (notification.recipientType === RecipientType.USER) {
      // Older appointment notifications stored the linked user as their recipient.
      // Resolve through the appointment instead of ever using that user's email.
      const payload = notification.payload as Record<string, unknown> | null;
      const appointmentId = notification.referenceId || (typeof payload?.appointmentId === 'string' ? payload.appointmentId : null);
      if (!appointmentId) throw new DeliverySkippedError('Legacy professional appointment is missing');
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId: notification.tenantId },
        select: { professionalId: true },
      });
      if (!appointment) throw new DeliverySkippedError('Legacy professional appointment was not found in tenant');
      professionalId = appointment.professionalId;
    }
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId: notification.tenantId, deletedAt: null },
      select: { id: true, email: true, userId: true, isActive: true, phoneCountryCode: true, phoneNumber: true },
    });
    if (!professional) throw new DeliverySkippedError('Professional was not found in tenant');
    if (['professional.day-start', 'professional.day-end'].includes(notification.type) && !professional.isActive) {
      throw new DeliverySkippedError('Professional is disabled');
    }
    return professional;
  }

  private async resolveInAppUser(notification: Notification): Promise<string> {
    if (!notification.tenantId) throw new DeliverySkippedError('In-app recipient requires a tenant');
    const userId = this.isProfessionalAppointment(notification)
      ? (await this.findProfessional(notification)).userId
      : notification.recipientType === RecipientType.USER
        ? notification.recipientId
        : null;
    if (!userId) throw new DeliverySkippedError('Recipient has no linked dashboard user');
    const membership = await this.prisma.membership.findFirst({
      where: { tenantId: notification.tenantId, userId, isActive: true },
      select: { id: true },
    });
    if (!membership) throw new DeliverySkippedError('Recipient has no active tenant membership');
    return userId;
  }

  private async resolveEmail(notification: Notification): Promise<string> {
    if (this.isProfessionalAppointment(notification)) {
      const professional = await this.findProfessional(notification);
      if (!professional.email?.trim()) throw new DeliverySkippedError('Professional has no email');
      return professional.email.trim();
    }
    if (notification.type === 'invitation.created') {
      const payload = notification.payload as Record<string, unknown> | null;
      if (typeof payload?.email !== 'string' || !payload.email.trim()) {
        throw new Error('Invitation has no email');
      }
      return payload.email.trim();
    }
    switch (notification.recipientType) {
      case RecipientType.USER: {
        const user = await this.usersService.findById(notification.recipientId);
        if (!user.email) throw new DeliverySkippedError('User has no email');
        return user.email;
      }
      case RecipientType.CUSTOMER: {
        if (!notification.tenantId) throw new Error('Tenant ID is required to resolve a customer');
        const customer = await this.customersService.findById(notification.tenantId, notification.recipientId);
        if (customer?.blockedAt) throw new DeliverySkippedError('Customer email is not verified');
        if (!customer?.email?.trim()) throw new DeliverySkippedError('Customer has no email');
        return customer.email.trim();
      }
      default:
        throw new Error(`Unsupported email recipient type: ${notification.recipientType}`);
    }
  }

  private async resolvePhone(notification: Notification): Promise<string> {
    let countryCode: string | null | undefined;
    let phoneNumber: string | null | undefined;
    if (this.isProfessionalAppointment(notification)) {
      const professional = await this.findProfessional(notification);
      countryCode = professional.phoneCountryCode;
      phoneNumber = professional.phoneNumber;
    } else {
      switch (notification.recipientType) {
        case RecipientType.USER: {
          const user = await this.usersService.findById(notification.recipientId);
          countryCode = user.phoneCountryCode;
          phoneNumber = user.phoneNumber;
          break;
        }
        case RecipientType.CUSTOMER: {
          if (!notification.tenantId) throw new Error('Tenant ID is required to resolve a customer');
          const customer = await this.customersService.findById(notification.tenantId, notification.recipientId);
          if (!customer?.phoneVerifiedAt || !customer.whatsappOptInAt || customer.blockedAt)
            throw new DeliverySkippedError('Customer phone is not verified');
          countryCode = customer?.phoneCountryCode;
          phoneNumber = customer?.phoneNumber;
          break;
        }
        default:
          throw new Error(`Unsupported WhatsApp recipient type: ${notification.recipientType}`);
      }
    }
    const digits = `${countryCode ?? ''}${phoneNumber ?? ''}`.replace(/\D/g, '');
    if (!countryCode || !phoneNumber || !digits) throw new DeliverySkippedError('Recipient has no phone number');
    return `+${digits}`;
  }
}
