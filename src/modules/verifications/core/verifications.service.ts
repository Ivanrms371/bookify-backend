import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { VerificationsRepository } from '../verifications.repository';
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
import { CustomersService } from 'src/modules/customers/customers.service';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VerificationsRepository,
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private sha256(val: string): string {
    return crypto.createHash('sha256').update(val).digest('hex');
  }

  private async emitVerificationCompleted(
    record: { id: string; type: string; recipientId: string; recipientType: string },
    tx: TransactionClient,
  ) {
    const verifiedAt = new Date();
    switch (record.type) {
      case VerificationType.CUSTOMER_PHONE_VERIFICATION:
        await this.customersService.markPhoneAsVerified(record.recipientId, tx);
        break;
      case VerificationType.CUSTOMER_EMAIL_VERIFICATION:
        await this.customersService.markEmailAsVerified(record.recipientId, tx);
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
        throw new BadRequestException(`Type of verification doesn't supported: ${record.type}`);
    }
  }

  private async checkIfAlreadyVerified(type: VerificationType, recipientId: string, tenantId?: string): Promise<boolean> {
    switch (type) {
      case VerificationType.CUSTOMER_PHONE_VERIFICATION: {
        if (!tenantId) {
          throw new NotFoundException('Customer cannot be found.');
        }
        const customer = await this.customersService.findById(tenantId, recipientId);
        return !!customer?.phoneVerifiedAt;
      }
      case VerificationType.CUSTOMER_EMAIL_VERIFICATION: {
        if (!tenantId) {
          throw new NotFoundException('Customer cannot be found.');
        }
        const customer = await this.customersService.findById(tenantId, recipientId);
        return !!customer?.emailVerifiedAt;
      }
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
    });
  }

  async requestVerification(dto: CreateVerificationDto) {
    const { type, recipientId, recipientType, tenantId } = dto;
    const isOtp = isOtpVerification(type);
    const isMagic = isMagicLinkVerification(type);

    if (!isOtp && !isMagic) {
      throw new BadRequestException('Tipo de verificación no soportado');
    }

    const isAlreadyVerified = await this.checkIfAlreadyVerified(type, recipientId, tenantId);
    if (isAlreadyVerified) {
      throw new BadRequestException('Ya se encuentra verificado');
    }

    // Protección anti-spam: Cooldown de 60s y tope de envíos
    const latest = await this.repository.findLatestActive(recipientId, recipientType, type);
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

    await this.repository.invalidateActive(recipientId, recipientType, type);

    const expiresAt = getVerificationExpiresAt(type);

    const record = await this.repository.create({
      type,
      recipientId,
      recipientType,
      tokenHash,
      codeHash,
      expiresAt,
      maxAttempts: VERIFICATION_MAX_ATTEMPTS,
      sentCount: (latest?.sentCount ?? 0) + 1,
    });

    this.eventEmitter.emit('verification.created', {
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

    const record = await this.repository.findByTokenHash(tokenHash);

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
      await this.repository.markAsVerified(record.id, tx);
      await this.emitVerificationCompleted(record, tx);
    });

    return { success: true, recipientId: record.recipientId, recipientType: record.recipientType };
  }

  async verifyCode(dto: VerifyOtpDto) {
    const { recipientId, recipientType, type, code } = dto;
    const record = await this.repository.findLatestActive(recipientId, recipientType, type);

    if (!record || !record.codeHash) {
      throw new NotFoundException('No hay una verificación activa para esta dirección');
    }

    if (record.verifiedAt !== null) {
      throw new BadRequestException('El código ya fue utilizado');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('El código de verificación ha expirado');
    }

    if (record.lockedAt !== null) {
      throw new BadRequestException('El código está bloqueado por demasiados intentos fallidos');
    }

    const inputHash = Buffer.from(this.sha256(code), 'hex');
    const targetHash = Buffer.from(record.codeHash, 'hex');

    const isValid = inputHash.length === targetHash.length && crypto.timingSafeEqual(inputHash, targetHash);

    if (!isValid) {
      await this.repository.registerFailedAttempt(record.id, record.attempts, record.maxAttempts);
      throw new BadRequestException('Código de verificación incorrecto');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.repository.markAsVerified(record.id, tx);
      await this.emitVerificationCompleted(record, tx);
    });

    return { success: true, recipientId: record.recipientId, recipientType: record.recipientType };
  }
}
