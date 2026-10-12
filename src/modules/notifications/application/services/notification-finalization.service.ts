import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { lockEntitlements } from 'src/common/database/entitlements-lock';
import { NotificationConfigService } from '../../notification-config.service';
import { ReconciliationConflictError } from '../../errors/reconciliation-conflict.error';
import type { DeliveryResolution, ReconciliationDelivery, ResolutionResult } from '../../types/notification-reconciliation.type';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

const AUDIT_PREFIX = 'RECONCILIATION: ';

@Injectable()
export class NotificationFinalizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: NotificationConfigService,
  ) {}

  async recordAcceptance(deliveryId: string, providerId: string, tenantId: string | null) {
    if (!providerId?.trim()) throw new ReconciliationConflictError('Missing provider acceptance ID');
    const result = await this.prisma.notificationDelivery.updateMany({
      where: {
        id: deliveryId,
        notification: { tenantId },
        status: 'PENDING',
        claimedAt: { not: null },
        OR: [{ externalReferenceId: null }, { externalReferenceId: providerId }],
      },
      data: { externalReferenceId: providerId, sentAt: new Date() },
    });
    if (result.count !== 1) throw new ReconciliationConflictError('Delivery is no longer claimed or has different acceptance evidence');
  }

  async resolve(input: DeliveryResolution): Promise<ResolutionResult> {
    this.verifyInput(input);
    return this.prisma.$transaction(async (tx) => {
      // Same lock order as reserve/release. Prisma cannot express SELECT FOR UPDATE.
      await lockEntitlements(tx);
      await tx.$queryRaw`SELECT id FROM notification_deliveries WHERE id = ${input.deliveryId}::uuid FOR UPDATE`;
      const delivery = await tx.notificationDelivery.findUnique({
        where: { id: input.deliveryId },
        include: { notification: true, usageReservation: true },
      });
      if (!delivery || delivery.notification.tenantId !== input.tenantId)
        throw new ReconciliationConflictError('Delivery not found in tenant');
      if (input.source !== 'worker' && delivery.channel !== 'EMAIL')
        throw new ReconciliationConflictError('Only email reconciliation is supported');
      this.verifyEvidence(delivery, input);
      if (delivery.status === 'SENT' && input.outcome === 'accepted' && delivery.usageReservation?.state !== 'RESERVED') {
        if (delivery.usageReservation?.state === 'RELEASED') throw new ReconciliationConflictError('Accepted delivery has released quota');
        return { deliveryId: delivery.id, status: 'SENT', changed: false };
      }
      if (delivery.status === 'FAILED' && input.outcome === 'not-accepted') {
        const previous = await tx.notificationLog.findFirst({
          where: { deliveryId: delivery.id, status: 'FAILED', errorMessage: { startsWith: AUDIT_PREFIX } },
          orderBy: { createdAt: 'desc' },
        });
        if (previous) return { deliveryId: delivery.id, status: 'FAILED', changed: false };
      }
      if (!(delivery.status === 'PENDING' && delivery.claimedAt) && !(delivery.status === 'SENT' && input.outcome === 'accepted')) {
        throw new ReconciliationConflictError('Delivery is not awaiting reconciliation');
      }
      await this.resolveQuota(tx, delivery, input);
      const status = input.outcome === 'accepted' ? 'SENT' : 'FAILED';
      await tx.notificationDelivery.update({
        where: { id: delivery.id },
        data:
          input.outcome === 'accepted'
            ? {
                status,
                externalReferenceId: input.providerId,
                sentAt: delivery.sentAt ?? input.acceptedAt ?? new Date(),
                errorMessage: null,
              }
            : { status, errorMessage: 'RECONCILED_NOT_ACCEPTED: provider non-acceptance confirmed' },
      });
      await tx.notificationLog.create({
        data: {
          deliveryId: delivery.id,
          status,
          errorMessage:
            AUDIT_PREFIX +
            JSON.stringify({
              source: input.source,
              outcome: input.outcome,
              operator: input.operator,
              evidence: input.evidence,
              providerId: input.providerId ?? null,
            }),
        },
      });
      return { deliveryId: delivery.id, status, changed: true };
    });
  }

  private verifyInput(input: DeliveryResolution) {
    if (!input.operator?.trim() || !input.evidence?.trim()) throw new ReconciliationConflictError('Operator and evidence are required');
    if (input.outcome === 'accepted' && !input.providerId?.trim())
      throw new ReconciliationConflictError('Provider ID is required for acceptance');
    if (input.source === 'manual' && !input.tenantId) throw new ReconciliationConflictError('Tenant is required for reconciliation');
    if (input.outcome === 'not-accepted' && input.source !== 'manual')
      throw new ReconciliationConflictError('Only manual evidence can release quota');
    if (input.acceptedAt && !Number.isFinite(input.acceptedAt.getTime()))
      throw new ReconciliationConflictError('Invalid acceptance timestamp');
  }

  private verifyEvidence(delivery: ReconciliationDelivery, input: DeliveryResolution) {
    if (delivery.externalReferenceId && (input.outcome !== 'accepted' || delivery.externalReferenceId !== input.providerId)) {
      throw new ReconciliationConflictError('Resolution contradicts stored provider acceptance');
    }
    if (input.source === 'cron' && delivery.externalReferenceId !== input.providerId)
      throw new ReconciliationConflictError('Cron requires stored provider ID');
    if (input.outcome === 'not-accepted' && (delivery.status === 'SENT' || delivery.usageReservation?.state === 'CONFIRMED')) {
      throw new ReconciliationConflictError('Confirmed acceptance cannot be reversed');
    }
  }

  private async resolveQuota(tx: TransactionClient, delivery: ReconciliationDelivery, input: DeliveryResolution) {
    const reservation = delivery.usageReservation;
    if (reservation && reservation.channel !== delivery.channel)
      throw new ReconciliationConflictError('Quota channel does not match delivery');
    if (!reservation) {
      if (
        input.outcome === 'accepted' &&
        this.config.isBillable(delivery.notification.type, delivery.notification.recipientType, delivery.channel)
      ) {
        throw new ReconciliationConflictError('Billable delivery has no quota reservation');
      }
      return;
    }
    if (input.outcome === 'accepted') {
      if (reservation.state === 'RELEASED') throw new ReconciliationConflictError('Quota reservation was already released');
      if (reservation.state !== 'RESERVED' && reservation.state !== 'CONFIRMED')
        throw new ReconciliationConflictError('Invalid quota reservation state');
      await tx.notificationUsageReservation.updateMany({
        where: { deliveryId: delivery.id, state: 'RESERVED' },
        data: { state: 'CONFIRMED', ambiguous: false },
      });
    } else if (reservation.state === 'RESERVED') {
      // Manual evidence is the only path allowed to release an ambiguous reservation.
      const released = await tx.notificationUsageReservation.updateMany({
        where: { deliveryId: delivery.id, state: 'RESERVED' },
        data: { state: 'RELEASED', ambiguous: false },
      });
      if (released.count) {
        const decremented = await tx.tenantUsage.updateMany({
          where: { id: reservation.usageId, tenantId: delivery.notification.tenantId!, emailCount: { gt: 0 } },
          data: { emailCount: { decrement: 1 } },
        });
        if (decremented.count !== 1) throw new ReconciliationConflictError('Original quota period cannot be decremented');
      }
    } else if (reservation.state !== 'RELEASED') throw new ReconciliationConflictError('Invalid quota reservation state');
  }
}
