import { SubscriptionsRepository } from '../subscriptions.repository';
import type { PrismaService } from 'src/shared/prisma/prisma.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { SubscriptionCreateInput } from 'src/generated/prisma/models';

describe('subscription persistence', () => {
  it('preserves an existing subscription and trial dates with an empty upsert update', async () => {
    const existing = { planId: 'pro', trialEndsAt: new Date('2020-01-01') };
    const tx = { subscription: { upsert: jest.fn().mockResolvedValue(existing) } };
    const repository = new SubscriptionsRepository({} as PrismaService);
    const create = { planId: 'pro_plus' } as SubscriptionCreateInput;
    expect(await repository.ensureTrial('tenant', create, tx as unknown as TransactionClient)).toBe(existing);
    expect(tx.subscription.upsert).toHaveBeenCalledWith({ where: { tenantId: 'tenant' }, create, update: {} });
  });
  it('scopes usage queries to the requested tenant and explicitly counts non-deleted resources', async () => {
    const prisma = { professional: { count: jest.fn().mockResolvedValue(2) }, service: { count: jest.fn().mockResolvedValue(7) } };
    const repository = new SubscriptionsRepository(prisma as unknown as PrismaService);
    expect(await repository.getResourceUsage('tenant-a')).toEqual({ professionals: 2, services: 7, countBasis: 'non_deleted' });
    expect(prisma.professional.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', deletedAt: null } });
    expect(prisma.service.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', deletedAt: null } });
  });
  it('settles only due downgrades and cycle switches for the requested tenant and clears all pending fields', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const repo = new SubscriptionsRepository({ subscription: { updateMany } } as unknown as PrismaService);
    const now = new Date('2026-11-03T12:00:00Z');
    await repo.applyDuePlanChanges('tenant-a', undefined, now);
    expect(updateMany).toHaveBeenCalledTimes(4);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        OR: [{ planId: 'pro_plus' }, { planId: 'pro', billingCycle: 'ANNUAL' }],
        pendingPlanId: 'pro',
        pendingBillingCycle: 'MONTHLY',
        planChangesAt: { lte: now },
      },
      data: { planId: 'pro', billingCycle: 'MONTHLY', amount: 14.99, pendingPlanId: null, pendingBillingCycle: null, planChangesAt: null },
    });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pendingPlanId: 'pro_plus',
          pendingBillingCycle: 'ANNUAL',
          OR: [{ planId: 'pro_plus', billingCycle: 'MONTHLY' }],
        }),
        data: expect.objectContaining({ planId: 'pro_plus', billingCycle: 'ANNUAL', amount: 239.88 }),
      }),
    );
  });
});
