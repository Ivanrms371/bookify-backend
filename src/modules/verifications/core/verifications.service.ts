import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerificationsRepository } from '../repositories/verifications.repository';
import { CodeGeneratorService } from './code-generator.service';
import { VerificationLocksService } from './verification-locks.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { CreateVerificationParams } from '../types/verification.interface';
import { channel } from 'diagnostics_channel';

@Injectable()
export class VerificationsService {
  private readonly logger = new Logger(VerificationsService.name);
  private readonly maxAttempts = 3;

  constructor(
    private readonly verificationsRepository: VerificationsRepository,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly lockService: VerificationLocksService,
  ) {}

  /**
   *  Create code verification
   */
  async createCodeVerification({ userId, type, address }: CreateVerificationParams) {
    await this.lockService.checkLock(userId);

    // generate code
    const code = this.codeGenerator.generateNumericCode();
    const codeHash = this.codeGenerator.generateCodeHash(code);

    // expires
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // create verification
    const verification = await this.verificationsRepository.create({
      type,
      userId,
      codeHash,
      expiresAt,
      address,
      maxAttempts: this.maxAttempts,
    });

    this.logger.log(`Verification created for user ${userId}`);

    // return code (plaintext) to send to user
    return {
      verification,
      code,
    };
  }

  /**
   * Create token verification
   */
  async createTokenVerification({ userId, type, address }: CreateVerificationParams) {
    const existing = await this.verificationsRepository.findPendingVerificationByUserAndType(userId, type);

    if (existing && this.maxAttempts <= existing.attempts) {
      throw new BadRequestException('Has superado el límite de intentos');
    }

    await this.lockService.checkLock(userId);

    const { token, tokenHash } = this.codeGenerator.generateTokenAndHash();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    if (existing) {
      await this.verificationsRepository.update(existing.id, {
        tokenHash,
        expiresAt,
        address,
        maxAttempts: this.maxAttempts,
        sentCount: { increment: 1 },
      });

      this.logger.log(`Verification updated for user ${userId}`);

      return token;
    }

    await this.verificationsRepository.create({
      type,
      userId,
      tokenHash,
      expiresAt,
      address,
      maxAttempts: this.maxAttempts,
    });

    this.logger.log(`Verification created for user ${userId}`);

    return token;
  }

  /**
   * Verify code
   */
  async verifyCode(userId: string, type: VerificationType, code: string) {
    // 1. check if is blocked
    await this.lockService.checkLock(userId);

    // 2. find verification
    const verification = await this.verificationsRepository.findPendingVerificationByUserAndType(userId, type);

    if (!verification) {
      throw new NotFoundException('Código de verificación no encontrado');
    }

    // 3. check expiration
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Código de verificación expirado');
    }

    // 4. Check if locked
    if (verification.lockedAt) {
      throw new BadRequestException('Código bloqueado por múltiples intentos fallidos');
    }

    // 5. Check if is code verification
    if (!verification.codeHash) {
      throw new BadRequestException('Código de verificación no encontrado');
    }

    const isValid = this.codeGenerator.verifyCodeHash(code, verification.codeHash);
    if (!isValid) {
      // increase attempts
      await this.verificationsRepository.incrementAttempts(verification.id);

      const attemptsLeft = verification.maxAttempts - verification.attempts - 1;

      if (attemptsLeft <= 0) {
        await this.verificationsRepository.lock(verification.id);
        await this.lockService.lockForMaxAttempts({
          address: verification.address,
          userId,
        });

        throw new BadRequestException('Código bloqueado por múltiples intentos fallidos');
      }

      throw new BadRequestException(`Código incorrecto. Te quedan ${attemptsLeft} intentos.`);
    }

    // Code valid
    await this.verificationsRepository.markAsVerified(verification.id);

    this.logger.log(`Verification successful for user ${userId} (${type})`);

    return verification;
  }

  /**
   * Verify token
   */
  async verifyToken(token: string) {
    // 1. Get hash of the token
    const tokenHash = this.codeGenerator.hashToken(token);

    // 2. find verification
    const verification = await this.verificationsRepository.findByToken(tokenHash);

    // 3. Check if exists
    if (!verification) {
      throw new NotFoundException({
        status: 404,
        error: 'verification_not_found',
        message: 'No hemos encontrado ninguna solicitud de verificación.',
      });
    }

    // 4. Check if is not expired
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException({
        status: 400,
        error: 'verification_expired',
        message: 'La verificación ha expirado.',
      });
    }

    // 5. Check if is not verified
    if (verification.verifiedAt) {
      throw new BadRequestException({
        status: 400,
        error: 'email_already_verified',
        message: 'Este enlance ya ha sido utilizado.',
      });
    }

    // 6. Mark as verified
    await this.verificationsRepository.markAsVerified(verification.id);

    this.logger.log(`Token verified for user ${verification.userId} (${verification.type})`);
    return { success: true, userId: verification.userId, type: verification.type };
  }

  /**
   * Resend code
   */
  async resendCode({ userId, type, address }: CreateVerificationParams) {
    const verification = await this.verificationsRepository.findPendingVerificationByUserAndType(userId, type);

    if (!verification) {
      throw new NotFoundException('Código de verificación no encontrado');
    }

    return await this.createTokenVerification({ userId, type, address });
  }
}
