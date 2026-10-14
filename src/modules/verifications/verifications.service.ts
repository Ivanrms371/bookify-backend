import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash, randomBytes } from 'node:crypto';
import { NotificationChannel, RecipientType, VerificationType } from 'src/generated/prisma/enums';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { VerificationModel } from 'src/generated/prisma/models';
import {
  getVerificationExpiresAt,
  isMagicLinkVerification,
  MAGIC_LINK_TOKEN_BYTES,
  VERIFICATION_MAX_ATTEMPTS,
} from './domain/verification-rules';
import type { VerificationCreatedEvent } from './types/verification-created-event';
import type {
  ConsumeVerificationInput,
  ConsumeVerificationResult,
  CreatedVerification,
  RequestVerificationInput,
  VerificationFailureReason,
  VerifyCodeInput,
  VerifyTokenInput,
} from './types/verification.types';
import { VerificationsRepository } from './verifications.repository';
import { createVerificationCode, matchesVerificationCode } from './utils/verification-code.util';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly verificationsRepository: VerificationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private checkVerificationState(verification: VerificationModel): VerificationFailureReason | null {
    if (verification.verifiedAt) {
      return 'used';
    }
    if (verification.expiresAt <= new Date()) {
      return 'expired';
    }
    if (verification.lockedAt || verification.attempts >= verification.maxAttempts) {
      return 'locked';
    }
    return null;
  }

  async consume(input: ConsumeVerificationInput, tx?: TransactionClient): Promise<ConsumeVerificationResult> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Proporciona un token y tipo, o un ID de verificación y código');
    }

    if ('token' in input) {
      if (
        'verificationId' in input ||
        'code' in input ||
        typeof input.token !== 'string' ||
        !input.token.trim() ||
        !Object.values(VerificationType).includes(input.type)
      ) {
        throw new BadRequestException('Proporciona únicamente un token y un tipo de verificación válido');
      }
      return this.verifyToken(input, tx);
    }

    if (
      'type' in input ||
      typeof input.verificationId !== 'string' ||
      !input.verificationId.trim() ||
      typeof input.code !== 'string' ||
      !input.code.trim()
    ) {
      throw new BadRequestException('Proporciona únicamente un ID de verificación y código');
    }
    return this.verifyCode(input, tx);
  }

  async verifyToken(input: VerifyTokenInput, tx?: TransactionClient): Promise<ConsumeVerificationResult> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const verification = await this.verificationsRepository.findByToken(tokenHash, tx);

    if (!verification || verification.type !== input.type) {
      return { success: false, reason: 'not-found' };
    }
    const failure = this.checkVerificationState(verification);
    if (failure) {
      return { success: false, reason: failure };
    }

    await this.verificationsRepository.markAsVerified(verification.id, tx);

    return {
      success: true,
      verification: {
        id: verification.id,
        type: verification.type,
        recipientId: verification.recipientId,
        recipientType: verification.recipientType,
        tenantId: verification.tenantId,
        destination: verification.destination,
      },
    };
  }

  async verifyCode(input: VerifyCodeInput, tx?: TransactionClient): Promise<ConsumeVerificationResult> {
    const verification = await this.verificationsRepository.findById(input.verificationId, tx);

    if (!verification || !verification.codeHash) {
      return { success: false, reason: 'not-found' };
    }
    const failure = this.checkVerificationState(verification);
    if (failure) {
      return { success: false, reason: failure };
    }

    if (!(await matchesVerificationCode(input.code, verification.codeHash))) {
      const updated = await this.verificationsRepository.incrementAttempts(verification.id, tx);
      if (updated.attempts >= updated.maxAttempts) {
        await this.verificationsRepository.markAsLocked(verification.id, tx);
      }
      return { success: false, reason: 'wrong-code' };
    }

    await this.verificationsRepository.markAsVerified(verification.id, tx);

    return {
      success: true,
      verification: {
        id: verification.id,
        type: verification.type,
        recipientId: verification.recipientId,
        recipientType: verification.recipientType,
        tenantId: verification.tenantId,
        destination: verification.destination,
      },
    };
  }

  async requestVerification(input: RequestVerificationInput): Promise<CreatedVerification> {
    const { recipientId, recipientType, type, tenantId } = input;
    const customerTypes: VerificationType[] = [VerificationType.CUSTOMER_VERIFICATION_EMAIL, VerificationType.CUSTOMER_VERIFICATION_PHONE];
    const userTypes: VerificationType[] = [
      VerificationType.USER_EMAIL_VERIFICATION,
      VerificationType.USER_PHONE_VERIFICATION,
      VerificationType.PASSWORD_RESET,
    ];

    if (
      !(recipientType === RecipientType.CUSTOMER && customerTypes.includes(type)) &&
      !(recipientType === RecipientType.USER && userTypes.includes(type))
    ) {
      throw new BadRequestException('El tipo de verificación no corresponde al destinatario');
    }

    const isPhone = type === VerificationType.CUSTOMER_VERIFICATION_PHONE || type === VerificationType.USER_PHONE_VERIFICATION;
    const channel = isPhone ? NotificationChannel.WHATSAPP : NotificationChannel.EMAIL;
    const usesToken = isMagicLinkVerification(type);

    let secret: string | null;
    let hash: string | null;
    if (usesToken) {
      secret = randomBytes(MAGIC_LINK_TOKEN_BYTES).toString('hex');
      hash = createHash('sha256').update(secret).digest('hex');
    } else {
      const generated = await createVerificationCode();
      secret = generated.code;
      hash = generated.hash;
    }

    const verification = await this.verificationsRepository.create({
      recipientId,
      recipientType,
      type,
      tenantId,
      channel,
      tokenHash: usesToken ? hash : null,
      codeHash: usesToken ? null : hash,
      expiresAt: getVerificationExpiresAt(type),
      maxAttempts: VERIFICATION_MAX_ATTEMPTS,
    });

    const event: VerificationCreatedEvent = {
      verificationId: verification.id,
      recipientId,
      recipientType,
      type,
      tenantId,
      channel,
      expiresAt: verification.expiresAt,
      ...(usesToken ? { token: secret } : { code: secret }),
    };
    await this.eventEmitter.emitAsync(isPhone ? 'created.phone.verification' : 'created.email.verification', event);

    return {
      id: verification.id,
      recipientId: verification.recipientId,
      recipientType: verification.recipientType,
      type: verification.type,
      tenantId: verification.tenantId,
      expiresAt: verification.expiresAt,
    };
  }
}
