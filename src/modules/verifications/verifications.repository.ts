import { Injectable } from '@nestjs/common';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';
import { VerificationCreateInput, VerificationModel } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class VerificationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async invalidateActive(
    recipientId: string,
    recipientType: RecipientType,
    type: VerificationType,
    tx?: TransactionClient,
  ): Promise<{ count: number }> {
    return this.db(tx).verification.deleteMany({
      where: {
        recipientId,
        recipientType,
        type,
        verifiedAt: null,
      },
    });
  }

  async create(data: VerificationCreateInput, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.create({ data });
  }

  async findByTokenHash(tokenHash: string, tx?: TransactionClient): Promise<VerificationModel | null> {
    return this.db(tx).verification.findUnique({
      where: { tokenHash },
    });
  }

  async findLatestActive(
    recipientId: string,
    recipientType: RecipientType,
    type: VerificationType,
    tx?: TransactionClient,
  ): Promise<VerificationModel | null> {
    return this.db(tx).verification.findFirst({
      where: {
        recipientId,
        recipientType,
        type,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async registerFailedAttempt(
    id: string,
    currentAttempts: number,
    maxAttempts: number,
    tx?: TransactionClient,
  ): Promise<VerificationModel> {
    const shouldLock = currentAttempts + 1 >= maxAttempts;

    return this.db(tx).verification.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        ...(shouldLock ? { lockedAt: new Date() } : {}),
      },
    });
  }

  async markAsVerified(id: string, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.update({
      where: { id },
      data: {
        verifiedAt: new Date(),
      },
    });
  }
}
