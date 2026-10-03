import type { PrismaService } from 'src/shared/prisma/prisma.service';
import { SubscriptionWebhookService } from '../subscription-webhook.service';
import { PlansService } from '../plans.service';
import { PLANS } from '../plans.config';
import type { SubscriptionsRepository } from '../subscriptions.repository';
import type { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import type { PaymentsService } from '../../payments/payments.service';
import type { ProviderSyncRepository } from 'src/common/webhooks/repositories/provider-sync.repository';

const invoice = (status = 'paid', version = '2026-10-02T12:00:00Z') => ({
  type: 'subscription-invoices',
  id: '500',
  attributes: {
    subscription_id: 123,
    customer_id: 22,
    status,
    total: 1499,
    currency: 'USD',
    refunded_amount: 0,
    created_at: version,
    updated_at: version,
  },
});
const subscription = (status = 'active', version = '2026-10-02T12:00:00Z') => ({
  type: 'subscriptions',
  id: '123',
  attributes: {
    variant_id: 42,
    customer_id: 22,
    status,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: version,
    renews_at: null,
    trial_ends_at: null,
    ends_at: status === 'cancelled' ? '2026-11-01T12:00:00Z' : null,
    cancelled: status === 'cancelled',
    card_brand: 'visa',
    card_last_four: '4242',
  },
});

function setup(event = 'subscription_payment_success') {
  const state = { subscription: 'TRIAL', payment: null as string | null, versions: {} as Record<string, string> };
  const tx = { transaction: true };
  const repo = {
    findByLemonSubscriptionId: jest.fn().mockResolvedValue({ id: 'local-sub', tenantId: 'tenant-A', deletedAt: null }),
    updateByLemonSubscriptionId: jest.fn(async (_id, data) => {
      state.subscription = data.status;
    }),
  };
  const provider = {
    verifyWebhookSignature: jest
      .fn()
      .mockReturnValue({ meta: { event_name: event, custom_data: { tenant_id: 'forged-B' } }, data: invoice() }),
    retrieveInvoice: jest.fn().mockResolvedValue(invoice()),
    retrieveSubscription: jest.fn().mockResolvedValue(subscription()),
  };
  const payments = {
    synchronizeInvoice: jest.fn(async (data) => {
      state.payment = data.attributes.status;
    }),
  };
  const sync = {
    acquireLock: jest.fn(),
    transaction: jest.fn(async (work) => {
      const before = structuredClone(state);
      try {
        return await work(tx);
      } catch (error) {
        Object.assign(state, before);
        throw error;
      }
    }),
    isNewer: jest.fn(async (resource, date) => !state.versions[resource] || Date.parse(date) > Date.parse(state.versions[resource])),
    matchesVersion: jest.fn(async (resource, date) => state.versions[resource] === date),
    markVersion: jest.fn(async (resource, date) => {
      state.versions[resource] = date;
    }),
    resolveFailure: jest.fn(),
    recordFailure: jest.fn(),
  };
  const service = new SubscriptionWebhookService(
    { $transaction: sync.transaction } as unknown as PrismaService,
    repo as unknown as SubscriptionsRepository,
    new PlansService(),
    provider as unknown as LemonSqueezyService,
    payments as unknown as PaymentsService,
    sync as unknown as ProviderSyncRepository,
  );
  return { service, state, tx, repo, provider, payments, sync };
}

describe('invoice/subscription webhook coordination', () => {
  const original = PLANS.pro.pricing.MONTHLY.lemonVariantId;
  const originalPlus = PLANS.pro_plus.pricing.MONTHLY.lemonVariantId;
  beforeEach(() => {
    PLANS.pro.pricing.MONTHLY.lemonVariantId = '42';
    PLANS.pro_plus.pricing.MONTHLY.lemonVariantId = '43';
  });
  afterEach(() => {
    PLANS.pro.pricing.MONTHLY.lemonVariantId = original;
    PLANS.pro_plus.pricing.MONTHLY.lemonVariantId = originalPlus;
  });
  it('associates by invoice subscription ID, ignores custom tenant data, and shares one transaction', async () => {
    const { service, provider, repo, payments, sync, tx } = setup();
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(provider.retrieveInvoice).toHaveBeenCalledWith('500');
    expect(provider.retrieveSubscription).toHaveBeenCalledWith('123');
    expect(repo.findByLemonSubscriptionId).toHaveBeenCalledWith('123', tx);
    expect(payments.synchronizeInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: '500' }),
      { tenantId: 'tenant-A', subscriptionId: 'local-sub' },
      tx,
      false,
    );
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith('123', expect.objectContaining({ status: 'ACTIVE' }), tx);
    expect(provider.retrieveSubscription.mock.invocationCallOrder[0]).toBeLessThan(sync.transaction.mock.invocationCallOrder[0]);
  });
  it.each([
    'subscription_payment_success',
    'subscription_payment_failed',
    'subscription_payment_recovered',
    'subscription_payment_refunded',
  ])('handles %s', async (event) => {
    const { service, payments } = setup(event);
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(payments.synchronizeInvoice).toHaveBeenCalledTimes(1);
  });
  it('does not duplicate writes on repeated success/recovery deliveries', async () => {
    const { service, provider, payments, repo } = setup();
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    provider.verifyWebhookSignature.mockReturnValue({
      meta: { event_name: 'subscription_payment_recovered', custom_data: {} },
      data: invoice(),
    });
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(payments.synchronizeInvoice).toHaveBeenCalledTimes(1);
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledTimes(1);
  });
  it('rolls back subscription, payment and versions when payment persistence fails', async () => {
    const { service, state, payments, sync } = setup();
    payments.synchronizeInvoice.mockRejectedValueOnce(new Error('database failure') as never);
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('database failure');
    expect(state).toEqual({ subscription: 'TRIAL', payment: null, versions: {} });
    expect(sync.recordFailure).toHaveBeenCalled();
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(state.subscription).toBe('ACTIVE');
    expect(state.payment).toBe('paid');
  });
  it('keeps authoritative cancellation despite a delayed failed-payment event', async () => {
    const { service, provider, state, repo } = setup('subscription_payment_failed');
    provider.retrieveSubscription.mockResolvedValue(subscription('cancelled'));
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(state.subscription).toBe('CANCELLED');
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({ endsAt: new Date('2026-11-01T12:00:00Z') }),
      expect.anything(),
    );
  });
  it('rejects stale provider snapshots fetched before a concurrent newer write', async () => {
    const { service, state, repo, payments } = setup();
    state.versions = { 'subscriptions:123': '2026-10-03T12:00:00Z', 'subscription-invoices:500': '2026-10-03T12:00:00Z' };
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(repo.updateByLemonSubscriptionId).not.toHaveBeenCalled();
    expect(payments.synchronizeInvoice).not.toHaveBeenCalled();
  });
  it('retries invoices delivered before their subscription mapping exists', async () => {
    const { service, repo, payments } = setup();
    repo.findByLemonSubscriptionId.mockResolvedValue(null);
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('mapping not found');
    expect(payments.synchronizeInvoice).not.toHaveBeenCalled();
  });
  it('makes no local writes when provider retrieval fails', async () => {
    const { service, provider, sync } = setup();
    provider.retrieveSubscription.mockRejectedValue(new Error('provider offline'));
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('provider offline');
    expect(sync.transaction).not.toHaveBeenCalled();
  });
  it('rejects a provider invoice whose subscription/customer association changes', async () => {
    const { service, provider, sync } = setup();
    provider.retrieveInvoice.mockResolvedValue({ ...invoice(), attributes: { ...invoice().attributes, subscription_id: 999 } });
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('subscription mismatch');
    expect(sync.transaction).not.toHaveBeenCalled();
  });
  it.each([
    'subscription_updated',
    'subscription_cancelled',
    'subscription_resumed',
    'subscription_expired',
    'subscription_paused',
    'subscription_unpaused',
  ])('synchronizes %s without manufacturing payments', async (event) => {
    const { service, provider, payments, state } = setup();
    provider.verifyWebhookSignature.mockReturnValue({ meta: { event_name: event, custom_data: {} }, data: subscription() } as never);
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(state.subscription).toBe('ACTIVE');
    expect(payments.synchronizeInvoice).not.toHaveBeenCalled();
  });
  it('retries when provider API state is older than the triggering invoice event', async () => {
    const { service, provider, sync } = setup();
    provider.retrieveInvoice.mockResolvedValue(invoice('paid', '2026-10-01T12:00:00Z'));
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('has not caught up');
    expect(sync.transaction).not.toHaveBeenCalled();
  });
  it('rolls back payment too when persisting its version fails', async () => {
    const { service, state, sync } = setup();
    sync.markVersion.mockImplementation(async (resource, date) => {
      if (resource === 'subscription-invoices:500') throw new Error('version write failure');
      state.versions[resource] = date;
    });
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('version write failure');
    expect(state).toEqual({ subscription: 'TRIAL', payment: null, versions: {} });
  });
  it('keeps the current cycle until a confirmed cycle switch reaches its original deadline', async () => {
    const { service, provider, repo } = setup('subscription_updated');
    const deadline = new Date('2099-11-03T12:00:00Z');
    const originalAnnual = PLANS.pro.pricing.ANNUAL!.lemonVariantId;
    PLANS.pro.pricing.ANNUAL!.lemonVariantId = '44';
    try {
      repo.findByLemonSubscriptionId.mockResolvedValue({
        id: 'local-sub',
        tenantId: 'tenant-A',
        deletedAt: null,
        planId: 'pro',
        billingCycle: 'MONTHLY',
        amount: 14.99,
        pendingPlanId: 'pro',
        pendingBillingCycle: 'ANNUAL',
        planChangesAt: null,
        currentPeriodEnd: deadline,
      } as never);
      const current = {
        ...subscription(),
        attributes: { ...subscription().attributes, variant_id: 44, renews_at: deadline.toISOString() },
      };
      provider.retrieveSubscription.mockResolvedValue(current);
      provider.verifyWebhookSignature.mockReturnValue({ meta: { event_name: 'subscription_updated' }, data: current } as never);
      await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          planId: 'pro',
          billingCycle: 'MONTHLY',
          amount: 14.99,
          planChangesAt: deadline,
        }),
        expect.anything(),
      );
    } finally {
      PLANS.pro.pricing.ANNUAL!.lemonVariantId = originalAnnual;
    }
  });
  it('keeps effective Pro after a lifecycle-only upgrade update', async () => {
    const { service, provider, repo } = setup();
    repo.findByLemonSubscriptionId.mockResolvedValue({
      id: 'local-sub',
      tenantId: 'tenant-A',
      deletedAt: null,
      planId: 'pro',
      billingCycle: 'MONTHLY',
      amount: 14.99,
      pendingPlanId: 'pro_plus',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: new Date('2026-10-02T11:00:00Z'),
      lemonCustomerId: '22',
    } as never);
    const current = { ...subscription(), attributes: { ...subscription().attributes, variant_id: 43 } };
    provider.retrieveSubscription.mockResolvedValue(current);
    provider.verifyWebhookSignature.mockReturnValue({ meta: { event_name: 'subscription_updated' }, data: current } as never);
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({ planId: 'pro', amount: 14.99 }),
      expect.anything(),
    );
  });
  it('confirms a paid upgrade even when subscription version is already synchronized', async () => {
    const { service, provider, repo, state } = setup();
    repo.findByLemonSubscriptionId.mockResolvedValue({
      id: 'local-sub',
      tenantId: 'tenant-A',
      deletedAt: null,
      planId: 'pro',
      billingCycle: 'MONTHLY',
      amount: 14.99,
      pendingPlanId: 'pro_plus',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: new Date('2026-10-02T11:00:00Z'),
      lemonCustomerId: '22',
    } as never);
    const paid = { ...invoice(), attributes: { ...invoice().attributes, billing_reason: 'updated' } };
    provider.retrieveInvoice.mockResolvedValue(paid);
    Object.assign(provider, { retrieveLatestInvoice: jest.fn().mockResolvedValue(paid) });
    provider.retrieveSubscription.mockResolvedValue({ ...subscription(), attributes: { ...subscription().attributes, variant_id: 43 } });
    state.versions['subscriptions:123'] = subscription().attributes.updated_at;
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({ planId: 'pro_plus', pendingPlanId: null }),
      expect.anything(),
    );
  });
  it('does not confirm an upgrade from a delayed older invoice when another invoice is current', async () => {
    const { service, provider, repo } = setup();
    repo.findByLemonSubscriptionId.mockResolvedValue({
      id: 'local-sub',
      tenantId: 'tenant-A',
      deletedAt: null,
      planId: 'pro',
      billingCycle: 'MONTHLY',
      pendingPlanId: 'pro_plus',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: new Date('2026-10-02T11:00:00Z'),
      lemonCustomerId: '22',
    } as never);
    const paid = { ...invoice(), attributes: { ...invoice().attributes, billing_reason: 'updated' } };
    provider.retrieveInvoice.mockResolvedValue(paid);
    Object.assign(provider, {
      retrieveLatestInvoice: jest.fn().mockResolvedValue({ ...paid, id: '501', attributes: { ...paid.attributes, status: 'pending' } }),
    });
    provider.retrieveSubscription.mockResolvedValue({ ...subscription(), attributes: { ...subscription().attributes, variant_id: 43 } });
    await service.handleWebhook(Buffer.from('{}'), 'sig');
    expect(repo.updateByLemonSubscriptionId).toHaveBeenCalledWith('123', expect.objectContaining({ planId: 'pro' }), expect.anything());
  });
});
