import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationDeliveryCreateInput, NotificationDeliveryCreateManyInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class NotificationDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingToProcess(limit: number) {
    return this.prisma.notificationDelivery.findMany({
      where: {
        status: 'PENDING',
        runAt: {
          lte: new Date(),
        },
      },
      take: limit,
      orderBy: {
        runAt: 'asc',
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
        status: 'PENDING',
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

  async markAsSent(id: string, referenceId: string) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), ...(referenceId && { referenceId }) },
    });
  }

  async incrementRetries(deliveryId: string, data: { runAt?: Date; errorMessage?: string }) {
    return this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        retryCount: { increment: 1 },
        ...data,
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
