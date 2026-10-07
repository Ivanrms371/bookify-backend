import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from 'src/generated/prisma/client';
import type { Subscription } from 'src/generated/prisma/client';
import { PlanChangeSelectionDto } from '../dto/plan-change-selection.dto';
import { PlanChangeService } from '../plan-change.service';
import { PlansService } from '../plans.service';
import { getFreeEligibility } from '../plan-change-eligibility';
import { projectDuePlanChange, projectProviderPlanChange } from '../plan-change';
import { getSubscriptionAccess } from '../subscription-access';
import { PLANS } from '../plans.config';
import { LemonPlanChangeError } from 'src/shared/integrations/lemon-squeezy/exceptions/lemon-plan-change.error';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';

const now = new Date('2026-10-05T12:00:00Z');
const end = new Date('2026-11-05T12:00:00Z');
function local(overrides = {}) {
  return {
    id: 'local',
    tenantId: 'tenant',
    planId: 'pro',
    status: 'ACTIVE',
    deletedAt: null,
    updatedAt: now,
    paymentProvider: 'LEMON_SQUEEZY',
    lemonCustomerId: '22',
    lemonSubscriptionId: '123',
    billingCycle: 'MONTHLY',
    currentPeriodEnd: end,
    trialEndsAt: end,
    trialStartedAt: now,
    amount: new Prisma.Decimal(14.99),
    endsAt: null,
    pendingPlanId: null,
    pendingBillingCycle: null,
    planChangesAt: null,
    planChangeUndoRequestedAt: null,
    ...overrides,
  } as Subscription;
}
function provider(overrides = {}) {
  return {
    id: '123',
    type: 'subscriptions',
    attributes: {
      customer_id: 22,
      variant_id: 42,
      status: 'active',
      cancelled: false,
      ends_at: null,
      renews_at: end.toISOString(),
      updated_at: now.toISOString(),
      created_at: now.toISOString(),
      payment_processor: 'stripe',
      trial_ends_at: null,
      ...overrides,
    },
  } as LemonSqueezySubscriptionData;
}
function setup(overrides = {}) {
  let record = local(overrides);
  const tx = {};
  let version = 0;
  const repo = {
    applyDuePlanChanges: jest.fn(),
    findByTenantId: jest.fn(async () => record),
    getCheckoutTenant: jest.fn().mockResolvedValue({ workspaceType: 'INDIVIDUAL', deletedAt: null }),
    getResourceUsage: jest.fn().mockResolvedValue({ professionals: 1, services: 10 }),
    updateByTenantId: jest.fn(async (_tenant, data) => {
      record = { ...record, ...data, updatedAt: new Date(now.getTime() + ++version) };
      return record;
    }),
  };
  const lemon = {
    retrieveSubscription: jest.fn().mockResolvedValue(provider()),
    setSubscriptionCancelled: jest.fn(async (_id, cancel) =>
      cancel ? provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() }) : provider(),
    ),
    updateSubscriptionPlan: jest.fn(),
    retrieveLatestInvoice: jest.fn(),
  };
  const sync = {
    acquireLock: jest.fn(),
    isNewer: jest.fn().mockResolvedValue(true),
    matchesVersion: jest.fn().mockResolvedValue(true),
    markVersion: jest.fn(),
  };
  const prisma = { $transaction: jest.fn(async (work) => work(tx)) };
  const service = new PlanChangeService(prisma as never, repo as never, new PlansService(), lemon as never, sync as never);
  return { service, repo, lemon, sync, record: () => record };
}
const target = { planId: 'pro' as const, cycle: 'MONTHLY' as const, price: 14.99 };

describe('Free through existing plan-change flow', () => {
  const original = PLANS.pro.pricing.MONTHLY.lemonVariantId;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    PLANS.pro.pricing.MONTHLY.lemonVariantId = '42';
  });
  afterEach(() => {
    jest.useRealTimers();
    PLANS.pro.pricing.MONTHLY.lemonVariantId = original;
  });
  it.each([{ planId: 'free' }, { planId: 'pro', cycle: 'MONTHLY' }, { planId: 'pro_plus', cycle: 'ANNUAL' }])(
    'accepts valid selection %j',
    async (request) => {
      expect(await validate(plainToInstance(PlanChangeSelectionDto, request))).toHaveLength(0);
    },
  );
  it.each([{ planId: 'free', cycle: 'ANNUAL' }, { planId: 'pro' }, { planId: 'bad' }, { planId: 'pro', cycle: 'bad' }])(
    'rejects invalid selection %j',
    async (request) => {
      expect((await validate(plainToInstance(PlanChangeSelectionDto, request))).length).toBeGreaterThan(0);
    },
  );
  it('activates immediately from a trial and preserves its original entitlement history', async () => {
    const f = setup({ status: 'TRIAL', planId: 'pro_plus', lemonSubscriptionId: null, lemonCustomerId: null });
    expect(await f.service.getEligibility('tenant', { planId: 'free' })).toMatchObject({
      eligible: true,
      effectiveAt: null,
      endsTrial: true,
    });
    expect(await f.service.change('tenant', { planId: 'free' })).toMatchObject({ state: 'confirmed', planId: 'free' });
    expect(f.record()).toMatchObject({
      status: 'ACTIVE',
      billingCycle: null,
      endsAt: null,
      currentPeriodEnd: null,
      trialEndsAt: end,
      trialStartedAt: now,
    });
    expect(f.record().amount!.toString()).toBe('0');
    expect(f.lemon.setSubscriptionCancelled).not.toHaveBeenCalled();
    expect(getSubscriptionAccess(f.record(), true)).toMatchObject({ canUseApp: true, effectivePlanId: 'free' });
  });
  it('rechecks caps inside the transaction before immediate activation', async () => {
    const f = setup({ status: 'TRIAL', lemonSubscriptionId: null });
    f.repo.getResourceUsage
      .mockResolvedValueOnce({ professionals: 1, services: 10 })
      .mockResolvedValueOnce({ professionals: 1, services: 11 });
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.repo.updateByTenantId).not.toHaveBeenCalled();
  });
  it.each(['PAUSED', 'PAST_DUE', 'SUSPENDED'])('blocks %s and directs recovery to the provider', async (status) => {
    const f = setup({ status });
    expect(await f.service.getEligibility('tenant', { planId: 'free' })).toMatchObject({
      eligible: false,
      blockers: expect.arrayContaining([expect.objectContaining({ resource: 'provider' })]),
    });
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.lemon.setSubscriptionCancelled).not.toHaveBeenCalled();
  });
  it('blocks excess non-deleted usage regardless of workspace type', async () => {
    const f = setup();
    f.repo.getCheckoutTenant.mockResolvedValue({ workspaceType: 'TEAM', deletedAt: null });
    f.repo.getResourceUsage.mockResolvedValue({ professionals: 2, services: 11 });
    const eligibility = await f.service.getEligibility('tenant', { planId: 'free' });
    expect(eligibility.blockers.map((blocker) => blocker.resource)).toEqual(['professionals', 'services']);
  });
  it.each(['INDIVIDUAL', 'TEAM', null])('allows Free with workspace type %s within resource caps', async (workspaceType) => {
    const f = setup();
    f.repo.getCheckoutTenant.mockResolvedValue({ workspaceType, deletedAt: null });
    expect(await f.service.getEligibility('tenant', { planId: 'free' })).toMatchObject({ eligible: true, blockers: [] });
  });
  it('reserves intent before cancellation and preserves paid benefits until expiry', async () => {
    const f = setup();
    f.lemon.setSubscriptionCancelled.mockImplementation(async () => {
      expect(f.record()).toMatchObject({ pendingPlanId: 'free', planChangeUndoRequestedAt: null, planChangesAt: null });
      return provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() });
    });
    expect(await f.service.change('tenant', { planId: 'free' })).toMatchObject({
      state: 'confirmed',
      planId: 'pro',
      pendingPlanId: 'free',
      planChangesAt: end.toISOString(),
    });
    expect(f.lemon.setSubscriptionCancelled).toHaveBeenCalledWith('123', true);
    expect(f.lemon.updateSubscriptionPlan).not.toHaveBeenCalled();
    expect(getSubscriptionAccess(f.record(), true)).toMatchObject({ canUseApp: true, effectivePlanId: 'pro' });
    await f.service.change('tenant', { planId: 'free' });
    expect(f.lemon.setSubscriptionCancelled).toHaveBeenCalledTimes(1);
  });
  it('adopts an already cancelled paid subscription without sending a duplicate cancellation', async () => {
    const f = setup({ status: 'CANCELLED', endsAt: end });
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() }));
    await f.service.change('tenant', { planId: 'free' });
    expect(f.record().planChangesAt).toEqual(end);
    expect(f.record().planChangeUndoRequestedAt).toBeNull();
    expect(f.lemon.setSubscriptionCancelled).not.toHaveBeenCalled();
  });
  it('keeps uncertain cancellation pending and explicit refresh recovers it', async () => {
    const f = setup();
    f.lemon.setSubscriptionCancelled.mockRejectedValueOnce(new LemonPlanChangeError(false));
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.record()).toMatchObject({ planChangeUndoRequestedAt: null, planChangesAt: null });
    expect(projectDuePlanChange(f.record(), new Date('2027-01-01')).planId).toBe('pro');
    await f.service.refresh('tenant');
    expect(f.record().planChangesAt).toEqual(end);
    expect(f.record().planChangeUndoRequestedAt).toBeNull();
  });
  it('rolls back a definite provider rejection without losing the paid subscription', async () => {
    const f = setup();
    f.lemon.setSubscriptionCancelled.mockRejectedValue(new LemonPlanChangeError(true));
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.record()).toMatchObject({ planId: 'pro', pendingPlanId: null, planChangeUndoRequestedAt: null });
  });
  it('undo resumes the same paid subscription and clears the schedule only after confirmation', async () => {
    const f = setup({ status: 'CANCELLED', endsAt: end, pendingPlanId: 'free', planChangeUndoRequestedAt: null, planChangesAt: end });
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() }));
    f.lemon.setSubscriptionCancelled.mockImplementation(async () => {
      expect(f.record().planChangeUndoRequestedAt).toEqual(now);
      return provider();
    });
    expect(await f.service.cancel('tenant')).toMatchObject({ state: 'confirmed', planId: 'pro', pendingPlanId: null });
    expect(f.lemon.setSubscriptionCancelled).toHaveBeenCalledWith('123', false);
    expect(f.record()).toMatchObject({ status: 'ACTIVE', planChangeUndoRequestedAt: null, endsAt: null });
  });
  it('a rejected undo preserves the confirmed Free schedule', async () => {
    const f = setup({ status: 'CANCELLED', endsAt: end, pendingPlanId: 'free', planChangeUndoRequestedAt: null, planChangesAt: end });
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() }));
    f.lemon.setSubscriptionCancelled.mockRejectedValue(new LemonPlanChangeError(true));
    await expect(f.service.cancel('tenant')).rejects.toThrow();
    expect(f.record().planChangesAt).toEqual(end);
    expect(f.record().planChangeUndoRequestedAt).toBeNull();
  });
  it('an uncertain undo preserves intent for refresh and does not automatically activate Free', async () => {
    const f = setup({ status: 'CANCELLED', endsAt: end, pendingPlanId: 'free', planChangeUndoRequestedAt: null, planChangesAt: end });
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ status: 'cancelled', cancelled: true, ends_at: end.toISOString() }));
    f.lemon.setSubscriptionCancelled.mockRejectedValueOnce(new LemonPlanChangeError(false));
    await expect(f.service.cancel('tenant')).rejects.toThrow();
    expect(f.record().planChangeUndoRequestedAt).toEqual(now);
    expect(projectDuePlanChange(f.record(), new Date('2027-01-01')).planId).toBe('pro');
    await f.service.refresh('tenant');
    expect(f.record().pendingPlanId).toBeNull();
  });
  it('never activates Free while the provider still has an active paid renewal', async () => {
    const f = setup({ status: 'EXPIRED' });
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.repo.updateByTenantId).not.toHaveBeenCalled();
  });
  it('activates an expired paid subscription without cancelling again', async () => {
    const f = setup({ status: 'EXPIRED' });
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ status: 'expired', cancelled: true, ends_at: now.toISOString() }));
    await f.service.change('tenant', { planId: 'free' });
    expect(f.record().planId).toBe('free');
    expect(f.record().lemonSubscriptionId).toBe('123');
  });
  it('rejects a provider subscription belonging to another customer', async () => {
    const f = setup();
    f.lemon.retrieveSubscription.mockResolvedValue(provider({ customer_id: 999 }));
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
    expect(f.repo.updateByTenantId).not.toHaveBeenCalled();
  });
  it('blocks an existing paid plan change', async () => {
    const f = setup({ pendingPlanId: 'pro_plus' });
    await expect(f.service.change('tenant', { planId: 'free' })).rejects.toThrow();
  });
  it('activates at the exact confirmed deadline and keeps trial/provider history', () => {
    const current = local({
      status: 'CANCELLED',
      endsAt: end,
      pendingPlanId: 'free',
      planChangeUndoRequestedAt: null,
      planChangesAt: end,
    });
    expect(projectDuePlanChange(current, new Date(end.getTime() - 1)).planId).toBe('pro');
    expect(projectDuePlanChange(current, end)).toMatchObject({
      planId: 'free',
      status: 'ACTIVE',
      billingCycle: null,
      endsAt: null,
      lemonSubscriptionId: '123',
      trialStartedAt: now,
    });
    expect(getSubscriptionAccess(current, true, end)).toMatchObject({ canUseApp: true, effectivePlanId: 'free' });
  });
  it('ignores old paid lifecycle projections once Free is active', () => {
    expect(projectProviderPlanChange(local({ planId: 'free' }), provider({ status: 'expired' }), target, false, now)).toEqual({});
  });
  it('a portal resumption removes a confirmed Free schedule but not an unconfirmed cancellation', () => {
    const current = local({ pendingPlanId: 'free', planChangesAt: end, planChangeUndoRequestedAt: null });
    expect(projectProviderPlanChange(current, provider(), target, false, now)).toMatchObject({
      pendingPlanId: null,
      planChangeUndoRequestedAt: null,
    });
    expect(projectProviderPlanChange({ ...current, planChangesAt: null }, provider(), target, false, now)).toEqual({});
  });
  it('an expired provider confirms Free after an uncertain undo rather than leaving it stuck', () => {
    const current = local({ pendingPlanId: 'free', planChangesAt: now, planChangeUndoRequestedAt: now });
    expect(
      projectProviderPlanChange(current, provider({ status: 'expired', cancelled: true, ends_at: now.toISOString() }), target, false, now),
    ).toMatchObject({ planId: 'free', status: 'ACTIVE' });
  });
});
