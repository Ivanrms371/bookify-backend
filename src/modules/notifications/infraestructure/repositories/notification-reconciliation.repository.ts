import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { NotificationDeliveryWhereInput } from 'src/generated/prisma/models';

@Injectable()
export class NotificationReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private pending(cutoff: Date): NotificationDeliveryWhereInput {
    return {
      channel: 'EMAIL',
      claimedAt: { lte: cutoff },
      OR: [{ status: 'PENDING' }, { status: 'SENT', usageReservation: { state: 'RESERVED' } }],
    };
  }

  candidates(cutoff: Date, after?: string) {
    return this.prisma.notificationDelivery.findMany({
      where: { ...this.pending(cutoff), externalReferenceId: { not: null }, ...(after ? { id: { gt: after } } : {}) },
      select: { id: true, externalReferenceId: true, notification: { select: { tenantId: true } } },
      orderBy: { id: 'asc' },
      take: 50,
    });
  }

  countWithoutProviderId(cutoff: Date) {
    return this.prisma.notificationDelivery.count({ where: { ...this.pending(cutoff), externalReferenceId: null } });
  }

  list(tenantId: string, cutoff: Date, limit = 50, after?: string) {
    return this.prisma.notificationDelivery.findMany({
      where: { ...this.pending(cutoff), notification: { tenantId }, ...(after ? { id: { gt: after } } : {}) },
      select: { id: true, status: true, claimedAt: true, sentAt: true, externalReferenceId: true, usageReservation: true },
      orderBy: { id: 'asc' },
      take: limit,
    });
  }

  inspect(tenantId: string, deliveryId: string) {
    return this.prisma.notificationDelivery.findFirst({
      where: { id: deliveryId, channel: 'EMAIL', notification: { tenantId } },
      select: {
        id: true,
        status: true,
        claimedAt: true,
        sentAt: true,
        externalReferenceId: true,
        errorMessage: true,
        usageReservation: true,
        logs: { orderBy: { createdAt: 'desc' }, take: 20, select: { status: true, createdAt: true, errorMessage: true } },
      },
    });
  }
}
