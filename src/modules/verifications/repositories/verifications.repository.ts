import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { VerificationType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class VerificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: VerificationType;
    userId: string;
    address: string; // email or phone
    tokenHash?: string;
    codeHash?: string;
    expiresAt: Date;
    maxAttempts?: number;
  }) {
    return this.prisma.verification.create({ data });
  }

  async update(verificationId: string, data: Prisma.VerificationUpdateInput) {
    return this.prisma.verification.update({
      where: {
        id: verificationId,
      },
      data,
    });
  }

  async findByToken(tokenHash: string) {
    return this.prisma.verification.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async findPendingVerificationByUserAndType(userId: string, type: VerificationType) {
    return this.prisma.verification.findFirst({
      where: {
        userId,
        type,
        verifiedAt: null,
      },
    });
  }

  async incrementAttempts(id: string) {
    return this.prisma.verification.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
      },
    });
  }

  async markAsVerified(id: string) {
    return this.prisma.verification.update({
      where: { id },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  async lock(id: string) {
    return this.prisma.verification.update({
      where: { id },
      data: {
        lockedAt: new Date(),
      },
    });
  }

  async deleteExpired() {
    const result = await this.prisma.verification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        verifiedAt: null,
      },
    });
    return result.count;
  }
}
