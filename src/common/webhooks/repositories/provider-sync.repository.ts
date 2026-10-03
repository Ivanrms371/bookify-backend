import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

// Persistent resource versions, not delivery IDs. Keep these out of log cleanup.
export const BILLING_SYNC_PROVIDER = 'LEMON_SQUEEZY_SYNC';

@Injectable()
export class ProviderSyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isNewer(resource: string, updatedAt: string, tx: Prisma.TransactionClient) {
    const log = await tx.webhookLog.findUnique({ where: { requestId: `${BILLING_SYNC_PROVIDER}:${resource}` } });
    const version = (log?.payload as { updatedAt?: string } | null)?.updatedAt;
    return !version || Date.parse(updatedAt) > Date.parse(version);
  }

  async matchesVersion(resource: string, updatedAt: string, tx: Prisma.TransactionClient) {
    const log = await tx.webhookLog.findUnique({ where: { requestId: `${BILLING_SYNC_PROVIDER}:${resource}` } });
    const version = (log?.payload as { updatedAt?: string } | null)?.updatedAt;
    return Boolean(version && Date.parse(version) === Date.parse(updatedAt));
  }

  acquireLock(tx: Prisma.TransactionClient) {
    return tx.$executeRaw`
    SELECT pg_advisory_xact_lock(73124, 1)
  `;
  }

  markVersion(resource: string, updatedAt: string, tx: Prisma.TransactionClient) {
    const data = {
      provider: BILLING_SYNC_PROVIDER,
      type: 'resource_version',
      resourceId: resource,
      status: 'PROCESSED' as const,
      payload: { updatedAt },
      processedAt: new Date(),
    };
    return tx.webhookLog.upsert({
      where: { requestId: `${BILLING_SYNC_PROVIDER}:${resource}` },
      create: { ...data, requestId: `${BILLING_SYNC_PROVIDER}:${resource}` },
      update: data,
    });
  }

  resolveFailure(requestId: string, tx: Prisma.TransactionClient) {
    return tx.webhookLog.updateMany({
      where: { requestId, status: 'ERROR' },
      data: { status: 'PROCESSED', error: null, processedAt: new Date() },
    });
  }

  recordFailure(requestId: string, resource: string) {
    const data = {
      provider: 'LEMON_SQUEEZY',
      type: 'billing_sync_failure',
      resourceId: resource,
      status: 'ERROR' as const,
      error: 'Billing synchronization failed; delivery may be retried.',
    };
    return this.prisma.webhookLog.upsert({ where: { requestId }, create: { ...data, requestId }, update: data });
  }
}
