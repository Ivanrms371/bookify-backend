import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { VerificationLocksRepository } from '../repositories/verification-locks.repository';
import { LockReason } from '../types/verification-types.enum';
import { LockVerificationParams } from '../types/verification.interface';

@Injectable()
export class VerificationLocksService {
  private readonly logger = new Logger(VerificationLocksService.name);

  constructor(private readonly lockRepository: VerificationLocksRepository) {}

  /**
   * Checks if a user is locked and throws an exception if so
   */
  async checkLock(userId: string) {
    const lock = await this.lockRepository.findActiveByUser(userId);
    if (lock) {
      const minutesLeft = Math.ceil((lock.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Cuena bloqueada temporariamente. Restan ${minutesLeft} minutos`);
    }
  }

  /**
   * Lock user to over max attempts
   */
  async lockForMaxAttempts({ userId, address, durationMinutes = 15 }: LockVerificationParams) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

    await this.lockRepository.create({
      userId,
      address,
      lockedUntil,
      reason: LockReason.MAX_ATTEMPTS_EXCEEDED,
    });

    this.logger.log(`User ${userId} locked for ${durationMinutes} minutes (max attempts)`);
  }

  /**
   * Lock for suspicious activity
   */
  async lockForSuspiciousActivity({ userId, address, durationMinutes = 60 }: LockVerificationParams) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

    await this.lockRepository.create({
      userId,
      address,
      lockedUntil,
      reason: LockReason.SUSPICIOUS_ACTIVITY,
    });

    this.logger.log(`User ${userId} locked for ${durationMinutes} minutes (suspicious activity)`);
  }

  /**
   * Unlock manually
   */
  async unlock(userId: string) {
    await this.lockRepository.unlock(userId);
    this.logger.log(`User ${userId} unlocked`);
  }
}
