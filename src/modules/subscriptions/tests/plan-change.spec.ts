import { Prisma } from 'src/generated/prisma/client';
import type { Subscription } from 'src/generated/prisma/client';
import type {
  LemonSqueezyInvoiceData,
  LemonSqueezySubscriptionData,
} from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import { PlanChangeService } from '../plan-change.service';
import { PlansService } from '../plans.service';
import { PLANS } from '../plans.config';
import { LemonPlanChangeError } from 'src/shared/integrations/lemon-squeezy/exceptions/lemon-plan-change.error';
import { getSubscriptionAccess } from '../subscription-access';
import { confirmsUpgradePayment, projectProviderPlanChange } from '../plan-change';

const now = new Date('2026-10-03T12:00:00Z');
const end = new Date('2026-11-03T12:00:00Z');
const localSubscription = (overrides = {}) =>
  ({
    id: 'local',
    tenantId: 'tenant',
    planId: 'pro',
    status: 'ACTIVE',
    deletedAt: null,
    paymentProvider: 'LEMON_SQUEEZY',
    lemonCustomerId: '22',
    lemonSubscriptionId: '123',
    billingCycle: 'MONTHLY',
    currentPeriodEnd: end,
    updatedAt: now,
    amount: new Prisma.Decimal('14.99'),
    pendingPlanId: null,
    pendingBillingCycle: null,
    planChangesAt: null,
    ...overrides,
  }) as Subscription;
const providerSubscription = (variant = 42, overrides = {}) =>
  ({
    id: '123',
    type: 'subscriptions',
    attributes: {
      variant_id: variant,
      customer_id: 22,
      status: 'active',
      payment_processor: 'stripe',
      renews_at: end.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      trial_ends_at: null,
      ends_at: null,
      cancelled: false,
      ...overrides,
    },
  }) as LemonSqueezySubscriptionData;
const paidInvoice = (overrides = {}) =>
  ({
    id: '501',
    type: 'subscription-invoices',
    attributes: {
      subscription_id: 123,
      customer_id: 22,
      status: 'paid',
      billing_reason: 'updated',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      ...overrides,
    },
  }) as LemonSqueezyInvoiceData;

function setup(overrides = {}) {
  let local = localSubscription(overrides);
  const tx = {};
  const repo = {
    applyDuePlanChanges: jest.fn(),
    findByTenantId: jest.fn(async () => local),
    getCheckoutTenant: jest.fn().mockResolvedValue({ workspaceType: 'TEAM', deletedAt: null }),
    getResourceUsage: jest.fn().mockResolvedValue({ professionals: 3, services: 30 }),
    reservePlanChange: jest.fn(async (_local, pendingPlanId, pendingBillingCycle, planChangesAt) => {
      local = { ...local, pendingPlanId, pendingBillingCycle, planChangesAt };
      return { count: 1 };
    }),
    restorePlanChange: jest.fn(async (previous) => {
      local = { ...previous };
    }),
    updateByTenantId: jest.fn(async (_tenant, update) => {
      local = { ...local, ...update };
      return local;
    }),
  };
  const provider = {
    retrieveSubscription: jest.fn().mockResolvedValue(providerSubscription(local.planId === 'pro' ? 42 : 43)),
    updateSubscriptionPlan: jest.fn(async (_id, variant) => providerSubscription(Number(variant))),
    retrieveLatestInvoice: jest.fn().mockResolvedValue(paidInvoice()),
  };
  const sync = {
    acquireLock: jest.fn(),
    isNewer: jest.fn().mockResolvedValue(true),
    matchesVersion: jest.fn().mockResolvedValue(true),
    markVersion: jest.fn(),
  };
  const prisma = { $transaction: jest.fn(async (work) => work(tx)) };
  const service = new PlanChangeService(prisma as never, repo as never, new PlansService(), provider as never, sync as never);
  return { service, repo, provider, sync, prisma, tx, local: () => local };
}

describe('simple subscription plan changes', () => {
  const original = [
    PLANS.pro.pricing.MONTHLY.lemonVariantId,
    PLANS.pro_plus.pricing.MONTHLY.lemonVariantId,
    PLANS.pro.pricing.ANNUAL!.lemonVariantId,
  ];
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    PLANS.pro.pricing.MONTHLY.lemonVariantId = '42';
    PLANS.pro_plus.pricing.MONTHLY.lemonVariantId = '43';
    PLANS.pro.pricing.ANNUAL!.lemonVariantId = '44';
  });
  afterEach(() => {
    jest.useRealTimers();
    [PLANS.pro.pricing.MONTHLY.lemonVariantId, PLANS.pro_plus.pricing.MONTHLY.lemonVariantId, PLANS.pro.pricing.ANNUAL!.lemonVariantId] =
      original;
  });
  it('keeps Pro while provider processes an upgrade, then grants Pro+ after a paid invoice', async () => {
    const { service, provider, local, repo, tx } = setup();
    provider.updateSubscriptionPlan.mockImplementation(async () => {
      expect(local().planId).toBe('pro');
      expect(local().pendingPlanId).toBe('pro_plus');
      return providerSubscription(43);
    });
    expect(await service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).toMatchObject({
      state: 'confirmed',
      planId: 'pro_plus',
      pendingPlanId: null,
    });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledWith('123', '43', true);
    expect(repo.getResourceUsage).toHaveBeenCalledWith('tenant', tx);
  });
  it('does not unlock an upgrade from a successful PATCH without successful payment', async () => {
    const { service, local, provider } = setup();
    provider.retrieveLatestInvoice.mockResolvedValue(paidInvoice({ status: 'pending' }));
    expect(await service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).toMatchObject({ state: 'pending', planId: 'pro' });
    expect(local().planId).toBe('pro');
    await service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
  });
  it('keeps Pro after a definite rejection and restores pending fields', async () => {
    const { service, local, provider } = setup();
    provider.updateSubscriptionPlan.mockRejectedValue(new LemonPlanChangeError(true));
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow();
    expect(local()).toMatchObject({ planId: 'pro', pendingPlanId: null, planChangesAt: null });
  });
  it('preserves upgrade intent on timeout and never retries a charge automatically', async () => {
    const { service, provider, local } = setup();
    provider.updateSubscriptionPlan.mockRejectedValue(new LemonPlanChangeError(false));
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow('No pudimos confirmar');
    expect(local()).toMatchObject({ planId: 'pro', pendingPlanId: 'pro_plus' });
    await service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
  });
  it('accepts a downgrade without proration and preserves all higher benefits until the original deadline', async () => {
    const { service, local, provider } = setup({ planId: 'pro_plus', amount: new Prisma.Decimal('24.99') });
    const result = await service.change('tenant', { planId: 'pro', cycle: 'MONTHLY' });
    expect(result).toMatchObject({ planId: 'pro_plus', pendingPlanId: 'pro', planChangesAt: end.toISOString() });
    expect(local().amount.toString()).toBe('24.99');
    expect(getSubscriptionAccess(local(), true, new Date(end.getTime() - 1)).effectivePlanId).toBe('pro_plus');
    expect(getSubscriptionAccess(local(), true, end).effectivePlanId).toBe('pro');
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledWith('123', '42', false);
  });
  it('does not create a confirmed schedule when a downgrade PATCH times out', async () => {
    const { service, provider, local } = setup({ planId: 'pro_plus' });
    provider.updateSubscriptionPlan.mockRejectedValue(new LemonPlanChangeError(false));
    await expect(service.change('tenant', { planId: 'pro', cycle: 'MONTHLY' })).rejects.toThrow();
    expect(local()).toMatchObject({ planId: 'pro_plus', pendingPlanId: 'pro', planChangesAt: null });
  });
  it('undoes a scheduled downgrade through the provider, then clears the three fields without a charge', async () => {
    const { service, provider, local } = setup({
      planId: 'pro_plus',
      pendingPlanId: 'pro',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: end,
    });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(42));
    expect(await service.cancel('tenant')).toMatchObject({ planId: 'pro_plus', pendingPlanId: null });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledWith('123', '43', false);
    expect(local().planChangesAt).toBeNull();
  });
  it('restores the scheduled downgrade if its cancellation is rejected', async () => {
    const { service, provider, local } = setup({
      planId: 'pro_plus',
      pendingPlanId: 'pro',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: end,
    });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(42));
    provider.updateSubscriptionPlan.mockRejectedValue(new LemonPlanChangeError(true));
    await expect(service.cancel('tenant')).rejects.toThrow();
    expect(local()).toMatchObject({ pendingPlanId: 'pro', planChangesAt: end });
  });
  it.each([
    { professionals: 4, services: 30 },
    { professionals: 3, services: 31 },
  ])('blocks downgrades exceeding a target cap: %j', async (usage) => {
    const { service, repo, provider } = setup({ planId: 'pro_plus' });
    repo.getResourceUsage.mockResolvedValue(usage);
    await expect(service.change('tenant', { planId: 'pro', cycle: 'MONTHLY' })).rejects.toThrow();
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it('rejects usage changes during preparation before provider mutation', async () => {
    const { service, repo, provider } = setup({ planId: 'pro_plus' });
    repo.getResourceUsage
      .mockResolvedValueOnce({ professionals: 3, services: 30 })
      .mockResolvedValueOnce({ professionals: 4, services: 30 });
    await expect(service.change('tenant', { planId: 'pro', cycle: 'MONTHLY' })).rejects.toThrow();
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it('rejects a concurrent subscription change before requesting a provider mutation', async () => {
    const { service, repo, provider, local } = setup();
    repo.findByTenantId.mockResolvedValueOnce(local()).mockResolvedValueOnce({ ...local(), updatedAt: new Date(now.getTime() + 1) });
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow('Actualiza el estado');
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
    expect(local().pendingPlanId).toBeNull();
  });
  it('does not call the provider when a concurrent request wins the pending reservation', async () => {
    const { service, repo, provider } = setup();
    repo.reservePlanChange.mockResolvedValue({ count: 0 });
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow('Actualiza el estado');
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it.each(['PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'TRIAL'])(
    'keeps plan changes unavailable for %s subscriptions',
    async (status) => {
      const { service, provider } = setup({ status });
      expect(await service.getEligibility('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).toMatchObject({
        eligible: false,
        blockers: [expect.objectContaining({ code: 'PLAN_CHANGE_UNAVAILABLE' })],
      });
      await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow();
      expect(provider.retrieveSubscription).not.toHaveBeenCalled();
      expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
    },
  );
  it('requires a confirmed paid period at its exact end before another plan change', async () => {
    const { service, provider } = setup({ currentPeriodEnd: now });
    expect(await service.getEligibility('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).toMatchObject({
      eligible: false,
      blockers: [expect.objectContaining({ code: 'PLAN_PERIOD_UNCONFIRMED' })],
    });
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow();
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it.each([
    ['MONTHLY', 'ANNUAL', 42, '44'],
    ['ANNUAL', 'MONTHLY', 44, '42'],
  ] as const)('schedules %s to %s without charging or losing the paid period', async (from, to, currentVariant, targetVariant) => {
    const { service, provider, local } = setup({ billingCycle: from });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(currentVariant));
    expect(await service.getEligibility('tenant', { planId: 'pro', cycle: to })).toMatchObject({
      eligible: true,
      kind: 'cycle',
      chargeImmediately: false,
      effectiveAt: end.toISOString(),
    });
    await service.change('tenant', { planId: 'pro', cycle: to });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledWith('123', targetVariant, false);
    expect(local()).toMatchObject({
      planId: 'pro',
      billingCycle: from,
      pendingPlanId: 'pro',
      pendingBillingCycle: to,
      planChangesAt: end,
      currentPeriodEnd: end,
    });
    expect(provider.retrieveLatestInvoice).not.toHaveBeenCalled();
    await service.change('tenant', { planId: 'pro', cycle: to });
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
    const current = providerSubscription(Number(targetVariant));
    expect(
      projectProviderPlanChange(
        local(),
        current,
        new PlansService().resolvePlanByVariantId(targetVariant),
        false,
        new Date(end.getTime() - 1),
      ),
    ).toMatchObject({ billingCycle: from, planChangesAt: end });
    expect(projectProviderPlanChange(local(), current, new PlansService().resolvePlanByVariantId(targetVariant), false, end)).toMatchObject(
      { billingCycle: to, pendingPlanId: null, planChangesAt: null },
    );
  });
  it('does not require resource cleanup for an unchanged plan and rejects a stale renewal before mutation', async () => {
    const { service, provider, repo } = setup();
    repo.getResourceUsage.mockResolvedValue({ professionals: 4, services: 31 });
    expect(await service.getEligibility('tenant', { planId: 'pro', cycle: 'ANNUAL' })).toMatchObject({ eligible: true });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(42, { renews_at: '2026-10-04T12:00:00Z' }));
    await expect(service.change('tenant', { planId: 'pro', cycle: 'ANNUAL' })).rejects.toThrow();
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it('undoes a cycle switch without charging and clears its pending fields', async () => {
    const { service, provider, local } = setup({ pendingPlanId: 'pro', pendingBillingCycle: 'ANNUAL', planChangesAt: end });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(44));
    await service.cancel('tenant');
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledWith('123', '42', false);
    expect(local()).toMatchObject({ billingCycle: 'MONTHLY', pendingPlanId: null, planChangesAt: null });
  });
  it('keeps an unconfirmed cycle request on timeout and reconciles without repeating the mutation', async () => {
    const { service, provider, local } = setup();
    provider.updateSubscriptionPlan.mockRejectedValue(new LemonPlanChangeError(false));
    await expect(service.change('tenant', { planId: 'pro', cycle: 'ANNUAL' })).rejects.toThrow();
    expect(local()).toMatchObject({ billingCycle: 'MONTHLY', pendingBillingCycle: 'ANNUAL', planChangesAt: null });
    await service.refresh('tenant');
    expect(local().pendingBillingCycle).toBe('ANNUAL');
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(44));
    await service.refresh('tenant');
    expect(local().planChangesAt).toEqual(end);
    expect(provider.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
  });
  it('does not confirm a cycle switch if Lemon changes the original renewal date', async () => {
    const { service, provider, local } = setup();
    provider.updateSubscriptionPlan.mockResolvedValue(providerSubscription(44, { renews_at: '2026-10-04T12:00:00Z' }));
    await expect(service.change('tenant', { planId: 'pro', cycle: 'ANNUAL' })).rejects.toThrow();
    expect(local()).toMatchObject({ billingCycle: 'MONTHLY', currentPeriodEnd: end, planChangesAt: null });
  });
  it('rejects combined plan and cycle changes without a provider call', async () => {
    const { service, provider } = setup();
    await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'ANNUAL' })).rejects.toThrow();
    expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
  });
  it('rejects mismatched customers and PayPal before provider mutation', async () => {
    for (const attributes of [{ customer_id: 23 }, { payment_processor: 'paypal' }]) {
      const { service, provider } = setup();
      provider.retrieveSubscription.mockResolvedValue(providerSubscription(42, attributes));
      await expect(service.change('tenant', { planId: 'pro_plus', cycle: 'MONTHLY' })).rejects.toThrow();
      expect(provider.updateSubscriptionPlan).not.toHaveBeenCalled();
    }
  });
  it('confirms payment even after lifecycle wrote the same provider version', async () => {
    const { service, provider, sync } = setup({ pendingPlanId: 'pro_plus', pendingBillingCycle: 'MONTHLY', planChangesAt: now });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(43));
    sync.isNewer.mockResolvedValue(false);
    expect(await service.refresh('tenant')).toMatchObject({ state: 'confirmed', planId: 'pro_plus' });
  });
  it('ignores older and unrelated paid invoices for an upgrade', () => {
    const local = localSubscription({ pendingPlanId: 'pro_plus', pendingBillingCycle: 'MONTHLY', planChangesAt: now });
    for (const attributes of [
      { created_at: '2026-10-02T12:00:00Z' },
      { billing_reason: 'initial' },
      { customer_id: 23 },
      { subscription_id: 124 },
      { status: 'refunded' },
    ]) {
      expect(confirmsUpgradePayment(local, providerSubscription(43), paidInvoice(attributes))).toBe(false);
    }
  });
  it('never extends a downgrade deadline when Lemon reports a later renewal date', () => {
    const local = localSubscription({ planId: 'pro_plus', pendingPlanId: 'pro', pendingBillingCycle: 'MONTHLY', planChangesAt: end });
    const target = new PlansService().resolvePlanByVariantId('42');
    expect(
      projectProviderPlanChange(local, providerSubscription(42, { renews_at: '2027-01-01T12:00:00Z' }), target, false, now).planChangesAt,
    ).toEqual(end);
  });
  it('never confirms an upgrade using an older subscription snapshot than the committed provider version', async () => {
    const { service, provider, sync, local } = setup({ pendingPlanId: 'pro_plus', pendingBillingCycle: 'MONTHLY', planChangesAt: now });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(43));
    sync.isNewer.mockResolvedValue(false);
    sync.matchesVersion.mockResolvedValue(false);
    expect(await service.refresh('tenant')).toMatchObject({ state: 'pending', planId: 'pro' });
    expect(local().pendingPlanId).toBe('pro_plus');
  });
  it('can reconcile a pending downgrade against an equal provider version without extending its deadline', async () => {
    const { service, provider, sync } = setup({
      planId: 'pro_plus',
      pendingPlanId: 'pro',
      pendingBillingCycle: 'MONTHLY',
      planChangesAt: null,
    });
    provider.retrieveSubscription.mockResolvedValue(providerSubscription(42));
    sync.isNewer.mockResolvedValue(false);
    sync.matchesVersion.mockResolvedValue(true);
    expect(await service.refresh('tenant')).toMatchObject({ planId: 'pro_plus', pendingPlanId: 'pro', planChangesAt: end.toISOString() });
  });
});
