import { Injectable } from '@nestjs/common';
import { InAppNotificationCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InAppNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: InAppNotificationCreateInput) {
    return this.prisma.inAppNotification.create({ data });
  }

  async countUnread(userId: string) {
    return this.prisma.inAppNotification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async findMany(userId: string, limit: number = 10) {
    return this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
