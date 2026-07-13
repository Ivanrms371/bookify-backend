import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { SessionCreateInput, SessionUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';
import { addDays } from 'date-fns';
import { SessionCreateDto } from './dto/session-create.dto';

@Injectable()
export class SessionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Crear una sesión nueva
   */
  async create(dto: SessionCreateDto, tx?: TransactionClient) {
    const jti = uuidv7();
    const deviceId = dto.deviceId || uuidv7();
    const expiresAt = addDays(new Date(), 30);
    console.log('deviceId', dto.deviceId);

    const data: SessionCreateInput = {
      jti,
      deviceId,
      expiresAt,
      lastUsedAt: new Date(),
      user: { connect: { id: dto.userId } },
    };

    return this.db(tx).session.create({ data });
  }

  /**
   * Find session by jti
   */
  async findByJti(jti: string, tx?: TransactionClient) {
    return this.db(tx).session.findUnique({
      where: { jti },
    });
  }

  /**
   * Find session by user and device
   */
  async findByUserIdAndDeviceId(userId: string, deviceId: string, tx?: TransactionClient) {
    return this.db(tx).session.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });
  }

  /**
   * Actualizar cualquier campo de sesión
   */
  async update(jti: string, data: SessionUpdateInput, tx?: TransactionClient) {
    return this.db(tx).session.update({
      where: { jti },
      data,
    });
  }

  /**
   * Marcar sesión como revocada
   */
  async revoke(jti: string, tx?: TransactionClient) {
    return this.db(tx).session.updateMany({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revocar todas las sesiones de un usuario
   */
  async revokeAll(userId: string, tx?: TransactionClient) {
    return this.db(tx).session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Upsert de sesión (opcional: usar si querés reusar sesiones por deviceId)
   */
  async upsert(dto: SessionCreateDto, tx?: TransactionClient) {
    const jti = uuidv7();
    const deviceId = dto.deviceId || uuidv7();
    const expiresAt = addDays(new Date(), 30);
    const { userId } = dto;

    return this.db(tx).session.upsert({
      where: { userId_deviceId: { userId, deviceId } }, // clave compuesta
      update: { lastUsedAt: new Date(), expiresAt, revokedAt: null },
      create: {
        jti,
        deviceId,
        userId,
        expiresAt,
        lastUsedAt: new Date(),
        revokedAt: null,
      },
    });
  }
}
