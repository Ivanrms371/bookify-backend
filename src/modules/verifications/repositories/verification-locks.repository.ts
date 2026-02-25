import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class VerificationLocksRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: string; address: string; lockedUntil: Date; reason?: string }) {
    return this.prisma.verificationLock.upsert({
      where: { userId: data.userId },
      create: data,
      update: {
        lockedUntil: data.lockedUntil,
        reason: data.reason,
      },
    });
  }

  async findActiveByUser(userId: string) {
    return this.prisma.verificationLock.findFirst({
      where: {
        userId,
        lockedUntil: { gt: new Date() },
      },
    });
  }

  async findActiveByAddress(address: string) {
    return this.prisma.verificationLock.findFirst({
      where: {
        address,
        lockedUntil: { gt: new Date() },
      },
    });
  }

  async unlock(userId: string) {
    return this.prisma.verificationLock.delete({
      where: { userId },
    });
  }

  async deleteExpired() {
    const result = await this.prisma.verificationLock.deleteMany({
      where: {
        lockedUntil: { lt: new Date() },
      },
    });
    return result.count;
  }
}
