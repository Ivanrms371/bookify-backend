import { SubscriptionsService } from '../subscriptions.service';
import { PlansService } from '../plans.service';
import type { SubscriptionsRepository } from '../subscriptions.repository';
import type { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

describe('subscription foundation', () => {
  afterEach(() => jest.useRealTimers());
  const setup = (record: unknown = null) => {
    const repository = {
      ensureTrial: jest.fn(),
      findByTenantId: jest.fn().mockResolvedValue(record),
      getResourceUsage: jest.fn().mockResolvedValue({ professionals: 1, services: 2, countBasis: 'non_deleted' }),
    };
    const service = new SubscriptionsService(
      repository as unknown as SubscriptionsRepository,
      new PlansService(),
      {} as LemonSqueezyService,
    );
    return { service, repository };
  };
  it('creates a fourteen-day Pro+ trial without a price/cycle using the caller transaction', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-02T12:00:00Z'));
    const { service, repository } = setup();
    const tx = {} as TransactionClient;
    await service.createTrialSubscription('tenant', tx);
    expect(repository.ensureTrial).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({
        tenant: { connect: { id: 'tenant' } },
        planId: 'pro_plus',
        status: 'TRIAL',
        trialStartedAt: new Date('2026-10-02T12:00:00Z'),
        trialEndsAt: new Date('2026-10-16T12:00:00Z'),
        amount: null,
        billingCycle: null,
      }),
      tx,
    );
  });
  it('returns a recoverable missing summary instead of 404 or creating a trial', async () => {
    const { service, repository } = setup();
    expect(await service.getBillingSummary('tenant')).toMatchObject({
      subscription: null,
      currentPlan: null,
      access: { reason: 'SUBSCRIPTION_REQUIRED' },
    });
    expect(repository.ensureTrial).not.toHaveBeenCalled();
  });
  it('omits provider IDs from the summary', async () => {
    const { service } = setup({
      id: 'local-id',
      planId: 'pro',
      status: 'ACTIVE',
      deletedAt: null,
      lemonCustomerId: 'secret-customer',
      lemonSubscriptionId: 'secret-subscription',
      amount: { toFixed: () => '14.99' },
      currency: 'USD',
    });
    const serialized = JSON.stringify(await service.getBillingSummary('tenant'));
    expect(serialized).not.toContain('secret-customer');
    expect(serialized).not.toContain('secret-subscription');
  });
});
