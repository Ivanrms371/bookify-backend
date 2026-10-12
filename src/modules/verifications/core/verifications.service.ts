import type { Customer, Verification } from 'src/generated/prisma/client';
import type { OtpVerificationFailure } from '../types/otp-verification.type';
import { WhatsappGateway } from 'src/modules/notifications/infraestructure/gateways/whatsapp.gateway';
import { CustomerEmailConflictException } from '../exceptions/customer-email-conflict.exception';
import { CustomerVerificationException } from '../exceptions/customer-verification.exception';
import { requiresCustomerVerification, hasVerifiedCustomerEmail, customerDestination } from '../domain/customer-verification-policy';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { CreateVerificationDto } from '../domain/dto/create-verification.dto';
import { VerifyOtpDto } from '../domain/dto/verify-otp.dto';
import {
  getVerificationExpiresAt,
  isOtpVerification,
  isMagicLinkVerification,
  VERIFICATION_MAX_ATTEMPTS,
} from '../domain/verification-rules';
import { VerifyTokenDto } from '../domain/dto/verify-token.dto';
import { ResendVerificationDto } from '../domain/dto/resend-verification.dto';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class VerificationsService {
  private readonly logger = new Logger(VerificationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async eligibleCustomer(customerId: string, tenantId: string, tx: TransactionClient) {
    const customer = await this.lockCustomer(tenantId, customerId, tx);
    if (!customer) throw new CustomerVerificationException();
    const subscription = await tx.subscription.findUnique({ where: { tenantId } });
    if (requiresCustomerVerification(subscription) && !hasVerifiedCustomerEmail(customer)) {
      throw new CustomerVerificationException('Debes verificar tu email antes de reservar.');
    }
    const future = await tx.appointment.count({
      where: { tenantId, customerId, createdBy: 'CUSTOMER', status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gt: new Date() } },
    });
    if (future >= 5) this.logger.warn(`PUBLIC_BOOKING_FUTURE_LIMIT tenant=${tenantId} customer=${customerId} count=${future + 1}`);
    return customer;
  }

  async requestCustomerVerification(tenantId: string, customerId: string, email?: string, phone = false) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await this.lockCustomer(tenantId, customerId, tx);
      if (!customer) throw new CustomerVerificationException();
      const destinationEmail = email?.trim().toLowerCase() || customerDestination(customer, 'EMAIL');
      if (!phone && customer.email && destinationEmail !== customerDestination(customer, 'EMAIL')) {
        throw new CustomerEmailConflictException();
      }
      const subscription = await tx.subscription.findUnique({ where: { tenantId } });
      if (
        phone
          ? !!(customer.phoneVerifiedAt && customer.whatsappOptInAt)
          : !requiresCustomerVerification(subscription) || hasVerifiedCustomerEmail(customer)
      ) {
        return { customerId, verificationRequired: false };
      }
      if (phone && !WhatsappGateway.isOperational())
        throw new CustomerVerificationException('La activación de WhatsApp no está disponible.');
      const type = phone ? VerificationType.CUSTOMER_VERIFICATION_PHONE : VerificationType.CUSTOMER_VERIFICATION_EMAIL;
      const channel = phone ? 'WHATSAPP' : 'EMAIL';
      const destination = phone ? customerDestination(customer, channel) : destinationEmail;
      if (!destination) throw new CustomerVerificationException('No hay un contacto disponible para verificar.');
      const code = crypto.randomInt(100000, 1000000).toString();
      const record = await tx.verification.create({
        data: {
          type,
          recipientType: 'CUSTOMER',
          recipientId: customerId,
          tenantId,
          channel,
          destination,
          contactWasMissing: !phone && !customer.email,
          codeHash: this.sha256(code),
          expiresAt: getVerificationExpiresAt(type),
          maxAttempts: VERIFICATION_MAX_ATTEMPTS,
        },
      });
      // Await durable outbox creation in this transaction. The worker sends after commit.
      await this.eventEmitter.emitAsync('verification.created', {
        verificationId: record.id,
        type: record.type,
        recipientId: customerId,
        recipientType: 'CUSTOMER',
        tenantId,
        code,
        expiresAt: record.expiresAt,
        channel,
        phone: customerDestination(customer, 'WHATSAPP'),
        email: channel === 'EMAIL' ? destination : null,
        tx,
      });
      return { customerId, verificationRequired: true, verificationId: record.id };
    });
  }

  async verifyCustomerCode(verificationId: string, code: string) {
    await this.verifyCode({ verificationId, code });
    return { success: true };
  }

  private matchesCustomerDestination(customer: Customer, record: Verification) {
    if (!record.destination) return false;
    if (record.type === VerificationType.CUSTOMER_VERIFICATION_PHONE) {
      return record.channel === 'WHATSAPP' && customerDestination(customer, 'WHATSAPP') === record.destination;
    }
    return (
      record.channel === 'EMAIL' &&
      (record.contactWasMissing ? !customer.email : customerDestination(customer, 'EMAIL') === record.destination)
    );
  }

  private async consumeOtp(record: Verification | null, code: string, tx: TransactionClient): Promise<OtpVerificationFailure | null> {
    if (!record?.codeHash) return 'not-found';
    if (record.verifiedAt) return 'used';
    if (record.expiresAt <= new Date()) return 'expired';
    if (record.lockedAt || record.attempts >= record.maxAttempts) return 'locked';
    const inputHash = Buffer.from(this.sha256(code), 'hex');
    const targetHash = Buffer.from(record.codeHash, 'hex');
    if (!/^\d{6}$/.test(code) || inputHash.length !== targetHash.length || !crypto.timingSafeEqual(inputHash, targetHash)) {
      await this.registerFailedAttempt(record.id, record.attempts, record.maxAttempts, tx);
      return 'wrong-code'; // Return so attempts commit before the HTTP exception.
    }
    await tx.verification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return null;
  }

  private async lockCustomer(tenantId: string, id: string, tx: TransactionClient) {
    // Prisma cannot express FOR UPDATE; contact edits and OTP completion share this lock.
    await tx.$queryRaw`SELECT id FROM customers WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid FOR UPDATE`;
    return tx.customer.findFirst({ where: { id, tenantId, deletedAt: null, blockedAt: null } });
  }

  private async lockVerification(id: string, tx: TransactionClient) {
    // Serialize attempts and completion after taking the customer lock.
    await tx.$queryRaw`SELECT id FROM verifications WHERE id = ${id}::uuid FOR UPDATE`;
    return tx.verification.findUnique({ where: { id } });
  }

  private findLatestActive(recipientId: string, recipientType: RecipientType, type: VerificationType) {
    return this.prisma.verification.findFirst({
      where: { recipientId, recipientType, type, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private registerFailedAttempt(id: string, attempts: number, maxAttempts: number, tx?: TransactionClient) {
    return (tx ?? this.prisma).verification.update({
      where: { id },
      data: { attempts: { increment: 1 }, ...(attempts + 1 >= maxAttempts ? { lockedAt: new Date() } : {}) },
    });
  }

  private sha256(val: string): string {
    return crypto.createHash('sha256').update(val).digest('hex');
  }

  private async emitVerificationCompleted(record: Verification, tx: TransactionClient) {
    switch (record.type) {
      case VerificationType.CUSTOMER_VERIFICATION_EMAIL:
        await tx.customer.update({
          where: { id: record.recipientId, tenantId: record.tenantId! },
          data: { ...(record.contactWasMissing ? { email: record.destination } : {}), emailVerifiedAt: new Date() },
        });
        break;
      case VerificationType.CUSTOMER_VERIFICATION_PHONE:
        await tx.customer.update({
          where: { id: record.recipientId, tenantId: record.tenantId! },
          data: { phoneVerifiedAt: new Date(), whatsappOptInAt: new Date() },
        });
        break;
      case VerificationType.USER_EMAIL_VERIFICATION:
        await this.usersService.markEmailAsVerified(record.recipientId, tx);
        break;
      case VerificationType.USER_PHONE_VERIFICATION:
        await this.usersService.markPhoneAsVerified(record.recipientId, tx);
        break;
      case VerificationType.PASSWORD_RESET:
        break;
      default:
        throw new BadRequestException('Tipo de verificación no soportado');
    }
  }

  private async checkIfAlreadyVerified(type: VerificationType, recipientId: string): Promise<boolean> {
    switch (type) {
      case VerificationType.USER_EMAIL_VERIFICATION: {
        const user = await this.usersService.findById(recipientId);
        return !!user?.emailVerifiedAt;
      }
      case VerificationType.USER_PHONE_VERIFICATION: {
        const user = await this.usersService.findById(recipientId);
        return !!user?.phoneVerifiedAt;
      }
      case VerificationType.PASSWORD_RESET:
        return false;
      default:
        return false;
    }
  }

  async resendByEmail(dto: ResendVerificationDto) {
    const { type, email } = dto;

    const isUserType =
      type === VerificationType.USER_EMAIL_VERIFICATION ||
      type === VerificationType.USER_PHONE_VERIFICATION ||
      type === VerificationType.PASSWORD_RESET;

    if (!isUserType) {
      throw new BadRequestException('Este tipo de verificación no soporta reenvío por email.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No existe una cuenta asociada a este email.');
    }

    return this.requestVerification({
      type,
      recipientId: user.id,
      recipientType: RecipientType.USER,
      invitationToken: dto.invitationToken,
    });
  }

  private async verifyInvitationEmailContext(dto: CreateVerificationDto) {
    if (!dto.invitationToken) {
      return;
    }
    if (dto.type !== VerificationType.USER_EMAIL_VERIFICATION) {
      throw new BadRequestException('La invitación solo puede acompañar una verificación de email.');
    }
    if (dto.recipientType !== RecipientType.USER) {
      throw new BadRequestException('La invitación debe corresponder a una cuenta de usuario.');
    }
    const invitation = await this.prisma.invitation.findUnique({ where: { token: dto.invitationToken } });
    if (!invitation) {
      throw new BadRequestException('Invitación no encontrada para esta verificación.');
    }
    if (invitation.revokedAt || invitation.acceptedAt) {
      throw new BadRequestException('Esta invitación ya no está pendiente.');
    }
    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('La invitación ha expirado.');
    }
    const user = await this.usersService.findById(dto.recipientId);
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException('La invitación no corresponde al destinatario de la verificación.');
    }
  }

  async requestVerification(dto: CreateVerificationDto) {
    const { type, recipientId, recipientType, tenantId } = dto;
    if (recipientType === RecipientType.CUSTOMER || type.startsWith('CUSTOMER_')) {
      throw new BadRequestException('Usa la verificación pública de clientes.');
    }
    await this.verifyInvitationEmailContext(dto);
    const isOtp = isOtpVerification(type);
    const isMagic = isMagicLinkVerification(type);

    if (!isOtp && !isMagic) {
      throw new BadRequestException('Tipo de verificación no soportado');
    }

    const isAlreadyVerified = await this.checkIfAlreadyVerified(type, recipientId);
    if (isAlreadyVerified) {
      throw new BadRequestException('Ya se encuentra verificado');
    }

    // Protección anti-spam: Cooldown de 60s y tope de envíos
    const latest = await this.findLatestActive(recipientId, recipientType, type);
    if (latest) {
      const elapsedSeconds = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const wait = Math.ceil(60 - elapsedSeconds);
        throw new BadRequestException(`Espera ${wait} segundos antes de solicitar otro código.`);
      }

      if (latest.sentCount >= 5) {
        throw new BadRequestException('Has superado el límite de intentos para esta dirección. Intenta más tarde.');
      }
    }

    let token: string | undefined;
    let tokenHash: string | undefined;
    let code: string | undefined;
    let codeHash: string | undefined;

    if (isMagic) {
      token = crypto.randomBytes(32).toString('hex');
      tokenHash = this.sha256(token);
    } else {
      code = crypto.randomInt(100000, 999999).toString();
      codeHash = this.sha256(code);
    }

    await this.prisma.verification.deleteMany({ where: { recipientId, recipientType, type, verifiedAt: null } });

    const expiresAt = getVerificationExpiresAt(type);

    const record = await this.prisma.verification.create({
      data: {
        type,
        recipientId,
        recipientType,
        ...(tenantId ? { tenant: { connect: { id: tenantId } } } : {}),
        tokenHash,
        codeHash,
        expiresAt,
        maxAttempts: VERIFICATION_MAX_ATTEMPTS,
        sentCount: (latest?.sentCount ?? 0) + 1,
      },
    });

    this.eventEmitter.emit('verification.created', {
      invitationToken: dto.invitationToken,
      tenantId,
      verificationId: record.id,
      type: record.type,
      recipientId: record.recipientId,
      recipientType: record.recipientType,
      token,
      code,
      expiresAt: record.expiresAt,
    });

    return { success: true };
  }

  async verifyToken(dto: VerifyTokenDto) {
    const { token, type } = dto;
    const tokenHash = this.sha256(token);

    const record = await this.prisma.verification.findUnique({ where: { tokenHash } });

    if (record?.recipientType === RecipientType.CUSTOMER) {
      throw new BadRequestException('Usa la verificación pública de clientes.');
    }
    if (!record || record.type !== type) {
      throw new NotFoundException('Verificación no encontrada o inválida');
    }

    if (record.verifiedAt !== null) {
      throw new BadRequestException('La verificación ya fue utilizada');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('La verificación ha expirado');
    }

    if (record.lockedAt !== null) {
      throw new BadRequestException('La verificación está bloqueada');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.verification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
      await this.emitVerificationCompleted(record, tx);
    });

    return { success: true, recipientId: record.recipientId, recipientType: record.recipientType };
  }

  async verifyCode(dto: VerifyOtpDto) {
    const { verificationId, recipientId, recipientType, type, code } = dto;
    if (
      !verificationId &&
      (!recipientId || !recipientType || !type || recipientType === RecipientType.CUSTOMER || type.startsWith('CUSTOMER_'))
    ) {
      throw new BadRequestException('Usa la verificación pública de clientes.');
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const initial = verificationId
        ? await tx.verification.findUnique({ where: { id: verificationId } })
        : await tx.verification.findFirst({
            where: { recipientId, recipientType, type, verifiedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
          });
      if (!initial) return { failure: 'not-found' as const, record: null };
      let customer: Customer | null = null;
      if (verificationId) {
        if (
          !initial.tenantId ||
          initial.recipientType !== RecipientType.CUSTOMER ||
          (initial.type !== VerificationType.CUSTOMER_VERIFICATION_EMAIL && initial.type !== VerificationType.CUSTOMER_VERIFICATION_PHONE)
        ) {
          return { failure: 'not-found' as const, record: null };
        }
        // Customer before challenge, matching contact edits and dispatch.
        customer = await this.lockCustomer(initial.tenantId, initial.recipientId, tx);
        if (!customer) return { failure: 'not-found' as const, record: null };
      }
      const record = await this.lockVerification(initial.id, tx);
      if (customer && (!record || !this.matchesCustomerDestination(customer, record))) {
        return { failure: 'not-found' as const, record: null };
      }
      const failure = await this.consumeOtp(record, code, tx);
      if (!failure && record) await this.emitVerificationCompleted(record, tx);
      return { failure, record };
    });
    if (result.failure || !result.record) {
      if (verificationId) throw new CustomerVerificationException();
      switch (result.failure) {
        case 'used':
          throw new BadRequestException('El código ya fue utilizado');
        case 'expired':
          throw new BadRequestException('El código de verificación ha expirado');
        case 'locked':
          throw new BadRequestException('El código está bloqueado por demasiados intentos fallidos');
        case 'wrong-code':
          throw new BadRequestException('Código de verificación incorrecto');
        default:
          throw new NotFoundException('No hay una verificación activa para esta dirección');
      }
    }
    return { success: true, recipientId: result.record.recipientId, recipientType: result.record.recipientType };
  }
}
