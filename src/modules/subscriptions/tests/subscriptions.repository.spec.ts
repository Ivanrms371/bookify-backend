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
});
