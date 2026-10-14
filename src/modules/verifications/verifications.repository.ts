import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { VerificationModel, VerificationUncheckedCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class VerificationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: string, tx?: TransactionClient): Promise<VerificationModel | null> {
    return this.db(tx).verification.findUnique({ where: { id } });
  }

  async findByToken(tokenHash: string, tx?: TransactionClient): Promise<VerificationModel | null> {
    return this.db(tx).verification.findUnique({ where: { tokenHash } });
  }

  async create(data: VerificationUncheckedCreateInput, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.create({ data });
  }

  async markAsVerified(id: string, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  async incrementAttempts(id: string, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markAsLocked(id: string, tx?: TransactionClient): Promise<VerificationModel> {
    return this.db(tx).verification.update({
      where: { id },
      data: { lockedAt: new Date() },
    });
  }
}
