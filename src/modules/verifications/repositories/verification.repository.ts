import { Injectable } from '@nestjs/common';
import { VerificationType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VerificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: VerificationType;
    userId: string;
    address: string; // email or phone
    ipAtCreated?: string;
    token?: string;
    codeHash?: string;
    expiresAt: Date;
    maxAttempts?: number;
  }) {
    await this.prisma.verification.deleteMany({
      where: {
        userId: data.userId,
        type: data.type,
      },
    });

    return this.prisma.verification.create({ data });
  }

  async findByToken(token: string) {
    return this.prisma.verification.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async findByUserAndType(userId: string, type: VerificationType) {
    return this.prisma.verification.findFirst({
      where: {
        userId,
        type,
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
