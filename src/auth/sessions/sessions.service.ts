import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { addDays, isAfter } from 'date-fns';
import { SessionsRepository } from './sessions.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SessionCreateDto } from './dto/session-create.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async findByUserAndDevice(userId: string, deviceId: string) {
    return this.sessionsRepository.findByUserIdAndDeviceId(userId, deviceId);
  }

  async upsert(dto: SessionCreateDto) {
    return this.sessionsRepository.upsert(dto);
  }

  async findByJti(jti: string) {
    const session = await this.sessionsRepository.findByJti(jti);
    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Sesión inválida.');
    }
    return session;
  }

  async extend(jti: string) {
    const newExpiresAt = addDays(new Date(), 30);
    const lastUsedAt = new Date();
    return this.sessionsRepository.update(jti, {
      lastUsedAt,
      expiresAt: newExpiresAt,
    });
  }

  async revoke(jti: string) {
    return this.sessionsRepository.revoke(jti);
  }

  async revokeAll(userId: string, tx?: TransactionClient) {
    return this.sessionsRepository.revokeAll(userId, tx);
  }
}
