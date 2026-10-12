import { memberNoticeVisibility } from '../../application/utils/member-notification-access';
import { Injectable } from '@nestjs/common';
import { InAppNotificationCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InAppNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: InAppNotificationCreateInput) {
    return this.prisma.inAppNotification.create({ data });
  }

  async countTotal(tenantId: string, userId: string) {
    return this.prisma.inAppNotification.count({
      where: { tenantId, userId, AND: [memberNoticeVisibility(tenantId, userId)] },
    });
  }

  async countUnread(tenantId: string, userId: string) {
    return this.prisma.inAppNotification.count({
      where: {
        tenantId,
        userId,
        AND: [memberNoticeVisibility(tenantId, userId)],
        readAt: null,
      },
    });
  }

  async findPage(tenantId: string, userId: string, limit: number, cursor?: string) {
    const anchor = cursor
      ? await this.prisma.inAppNotification.findFirst({
          where: { id: cursor, tenantId, userId, AND: [memberNoticeVisibility(tenantId, userId)] },
          select: { id: true, createdAt: true },
        })
      : null;
    if (cursor && !anchor) return { notifications: [], nextCursor: null };

    const notifications = await this.prisma.inAppNotification.findMany({
      where: {
        tenantId,
        userId,
        AND: [memberNoticeVisibility(tenantId, userId)],
        ...(anchor && {
          OR: [
            { createdAt: { lt: anchor.createdAt } },
            { createdAt: anchor.createdAt, id: { lt: anchor.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();
    return {
      notifications,
      nextCursor: hasMore ? notifications.at(-1)?.id ?? null : null,
    };
  }

  async markAsRead(id: string, tenantId: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, tenantId, userId, AND: [memberNoticeVisibility(tenantId, userId)] },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { tenantId, userId, readAt: null, AND: [memberNoticeVisibility(tenantId, userId)] },
      data: { readAt: new Date() },
    });
  }
}
