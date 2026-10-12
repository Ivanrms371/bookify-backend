import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from 'src/generated/prisma/enums';
import { NotificationDeliveryCreateInput, NotificationDeliveryCreateManyInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class NotificationDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureFallback(notificationId: string, channel: NotificationChannel) {
    // Existing unique(notificationId, channel) also protects concurrent workers.
    return this.prisma.notificationDelivery.upsert({
      where: { notificationId_channel: { notificationId, channel } },
      create: { notificationId, channel, runAt: new Date() },
      update: {},
    });
  }

  async claim(id: string, retryCount: number): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.notificationDelivery.updateMany({
      where: {
        id,
        status: NotificationStatus.PENDING,
        claimedAt: null,
        retryCount,
        OR: [{ runAt: null }, { runAt: { lte: now } }],
      },
      data: { claimedAt: now },
    });
    return result.count === 1;
  }

  async findPendingToProcess(limit: number) {
    return this.prisma.notificationDelivery.findMany({
      where: {
        status: NotificationStatus.PENDING,
        claimedAt: null,
        OR: [{ runAt: null }, { runAt: { lte: new Date() } }],
      },
      take: limit,
      orderBy: {
        runAt: { sort: 'asc', nulls: 'first' },
      },
      select: {
        id: true,
        channel: true,
        retryCount: true,
        notification: true,
      },
    });
  }

  async findPendingByNotification(notificationId: string) {
    return this.prisma.notificationDelivery.findMany({
      where: {
        notificationId,
        status: NotificationStatus.PENDING,
        OR: [{ runAt: null }, { runAt: { lte: new Date() } }],
      },
      include: {
        notification: true,
      },
    });
  }

  async exists(notificationId: string, channel: NotificationChannel) {
    return this.prisma.notificationDelivery.findFirst({
      where: {
        notificationId,
        channel,
      },
    });
  }

  async create(data: NotificationDeliveryCreateInput) {
    return this.prisma.notificationDelivery.create({ data });
  }

  async createMany(data: NotificationDeliveryCreateManyInput[]) {
    return this.prisma.notificationDelivery.createMany({ data });
  }

  async cancelByReferenceAndType(referenceId: string, type: string) {
    return this.prisma.notificationDelivery.updateMany({
      where: {
        status: NotificationStatus.PENDING,
        notification: {
          referenceId: referenceId,
          type,
        },
      },
      data: {
        status: NotificationStatus.CANCELLED,
      },
    });
  }

  async markAsExpired(id: string) {
    return this.prisma.notificationDelivery.updateMany({
      where: { id, status: NotificationStatus.PENDING },
      data: { status: NotificationStatus.CANCELLED, errorMessage: 'EXPIRED: notification delivery window ended' },
    });
  }

  async markAsSent(id: string, referenceId: string) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), ...(referenceId && { externalReferenceId: referenceId }) },
    });
  }

  async incrementRetries(deliveryId: string, data: { runAt?: Date; errorMessage?: string }) {
    return this.prisma.notificationDelivery.updateMany({
      where: { id: deliveryId, status: NotificationStatus.PENDING },
      data: {
        retryCount: { increment: 1 },
        claimedAt: null,
        runAt: data.runAt ?? new Date(),
        errorMessage: data.errorMessage ?? null,
      },
    });
  }

  async markAsFailed(id: string, errorMessage?: string) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: { status: 'FAILED', errorMessage },
    });
  }
}
