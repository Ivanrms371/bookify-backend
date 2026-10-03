import { ProviderSyncRepository, BILLING_SYNC_PROVIDER } from '../provider-sync.repository';
import type { PrismaService } from 'src/shared/prisma/prisma.service';

describe('billing transaction/version persistence', () => {
  it('acquires the transaction lock before reference allocation or resource writes', async () => {
    const calls: string[] = [];
    const tx = {
      $executeRaw: jest.fn(async () => {
        calls.push('lock');
      }),
    };
    const prisma = { $transaction: jest.fn(async (work) => work(tx)) };
    const repo = new ProviderSyncRepository(prisma as unknown as PrismaService);
    await prisma.$transaction(async (client) => {
      await repo.acquireLock(client as never);
      calls.push('writes');
    });
    expect(calls).toEqual(['lock', 'writes']);
  });
  it('rejects equal/older versions and accepts newer versions', async () => {
    const tx = { webhookLog: { findUnique: jest.fn().mockResolvedValue({ payload: { updatedAt: '2026-10-02T12:00:00Z' } }) } };
    const repo = new ProviderSyncRepository({} as PrismaService);
    expect(await repo.isNewer('subscriptions:123', '2026-10-02T11:00:00Z', tx as never)).toBe(false);
    expect(await repo.isNewer('subscriptions:123', '2026-10-02T12:00:00Z', tx as never)).toBe(false);
    expect(await repo.isNewer('subscriptions:123', '2026-10-02T13:00:00Z', tx as never)).toBe(true);
  });
  it('persists only resource version metadata on the supplied transaction', async () => {
    const tx = { webhookLog: { upsert: jest.fn() } };
    const repo = new ProviderSyncRepository({} as PrismaService);
    await repo.markVersion('subscription-invoices:500', '2026-10-02T12:00:00Z', tx as never);
    expect(tx.webhookLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: BILLING_SYNC_PROVIDER,
          requestId: `${BILLING_SYNC_PROVIDER}:subscription-invoices:500`,
          payload: { updatedAt: '2026-10-02T12:00:00Z' },
        }),
      }),
    );
  });
});
