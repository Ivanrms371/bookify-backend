import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { addDays, isAfter } from 'date-fns';
import { SessionsRepository } from './sessions.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SessionCreateDto } from './dto/session-create.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async createSession(dto: SessionCreateDto) {
    return this.sessionsRepository.create(dto);
  }

  async findSessionByUserAndDevice(userId: string, deviceId: string) {
    return this.sessionsRepository.findByUserIdAndDeviceId(userId, deviceId);
  }

  async upsertSession(dto: SessionCreateDto) {
    return this.sessionsRepository.upsert(dto);
  }

  async findCurrentSessionByJti(jti: string) {
    const session = await this.sessionsRepository.findByJti(jti);
    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      console.log('Sesión inválida.');
      throw new UnauthorizedException('Sesión inválida.');
    }
    return session;
  }

  async extendSession(jti: string) {
    const newExpiresAt = addDays(new Date(), 30);
    const lastUsedAt = new Date();
    return this.sessionsRepository.update(jti, {
      lastUsedAt,
      expiresAt: newExpiresAt,
    });
  }

  async revokeSession(jti: string) {
    return this.sessionsRepository.revoke(jti);
  }

  async revokeAllSessions(userId: string, tx?: TransactionClient) {
    return this.sessionsRepository.revokeAll(userId, tx);
  }
}
