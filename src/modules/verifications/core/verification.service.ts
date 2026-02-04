import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerificationRepository } from '../repositories/verification.repository';
import { CodeGeneratorService } from './code-generator.service';
import { VerificationLockService } from './verification-lock.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { CreateVerificationParams } from '../types/verification.interface';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly verificationRepository: VerificationRepository,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly lockService: VerificationLockService,
  ) {}

  /**
   *  Create code verification
   */
  async createCodeVerification({ userId, type, address, ip }: CreateVerificationParams) {
    await this.lockService.checkLock(userId);

    // generate code
    const code = this.codeGenerator.generateNumericCode();
    const codeHash = this.codeGenerator.generateCodeHash(code);

    // expires
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // create verification
    const verification = await this.verificationRepository.create({
      type,
      userId,
      codeHash,
      expiresAt,
      address,
      ipAtCreated: ip,
      maxAttempts: 3,
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
  async createTokenVerification({ userId, type, address, ip }: CreateVerificationParams) {
    await this.lockService.checkLock(userId);

    const token = this.codeGenerator.generateToken();

    // Expires: 1hs for tokens
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // create verification
    const verification = await this.verificationRepository.create({
      type,
      userId,
      token,
      expiresAt,
      address,
      ipAtCreated: ip,
      maxAttempts: 3,
    });

    this.logger.log(`Verification created for user ${userId}`);

    // return token to send to user
    return {
      verification,
      token,
    };
  }

  /**
   * Verify code
   */
  async verifyCode(userId: string, type: VerificationType, code: string) {
    // 1. check if is blocked
    await this.lockService.checkLock(userId);

    // 2. find verification
    const verification = await this.verificationRepository.findByUserAndType(userId, type);

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
      await this.verificationRepository.incrementAttempts(verification.id);

      const attemptsLeft = verification.maxAttempts - verification.attempts - 1;

      if (attemptsLeft <= 0) {
        await this.verificationRepository.lock(verification.id);
        await this.lockService.lockForMaxAttempts({
          address: verification.address,
          userId,
        });

        throw new BadRequestException('Código bloqueado por múltiples intentos fallidos');
      }

      throw new BadRequestException(`Código incorrecto. Te quedan ${attemptsLeft} intentos.`);
    }

    // Code valid
    await this.verificationRepository.markAsVerified(verification.id);

    this.logger.log(`Verification successful for user ${userId} (${type})`);

    return verification;
  }

  /**
   * Verify token
   */
  async verifyToken(token: string) {
    // 1. find verification
    const verification = await this.verificationRepository.findByToken(token);

    if (!verification) {
      throw new NotFoundException('No hemos encontrado ninguna solicitud de verificación.');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('La verificación ha expirado.');
    }

    if (verification.verifiedAt) {
      throw new BadRequestException('Este enlance ya ha sido utilizado.');
    }

    await this.verificationRepository.markAsVerified(verification.id);

    this.logger.log(`Token verified for user ${verification.userId} (${verification.type})`);

    return verification;
  }

  /**
   * Resend code
   */
  async resendCode({ userId, type, address }: CreateVerificationParams) {
    const verification = await this.verificationRepository.findByUserAndType(userId, type);

    if (!verification) {
      throw new NotFoundException('Código de verificación no encontrado');
    }

    return await this.createTokenVerification({ userId, type, address });
  }
}
