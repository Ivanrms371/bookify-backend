import { getCheckoutEligibility } from '../checkout-eligibility';
import { PLANS } from '../plans.config';

const now = new Date('2026-10-02T12:00:00Z');
const context = {
  plan: { ...PLANS.pro, pricing: { MONTHLY: { ...PLANS.pro.pricing.MONTHLY, lemonVariantId: '42' } } },
  cycle: 'MONTHLY' as const,
  workspaceType: 'INDIVIDUAL' as const,
  professionals: 1,
  services: 1,
};

describe('checkout eligibility time boundaries', () => {
  it('blocks a cancelled paid subscription until its access ends, then allows recovery', () => {
    const subscription = {
      planId: 'pro',
      status: 'CANCELLED' as const,
      deletedAt: null,
      lemonSubscriptionId: '123',
      trialEndsAt: null,
      endsAt: new Date(now.getTime() + 1),
    };
    expect(getCheckoutEligibility({ ...context, subscription }, now).blockers).toEqual([
      expect.objectContaining({ code: 'SUBSCRIPTION_ALREADY_EXISTS' }),
    ]);
    expect(getCheckoutEligibility({ ...context, subscription: { ...subscription, endsAt: now } }, now).eligible).toBe(true);
  });
  it('allows trial checkout before and at expiry without preserving remaining free days', () => {
    const subscription = {
      planId: 'pro_plus',
      status: 'TRIAL' as const,
      deletedAt: null,
      lemonSubscriptionId: null,
      endsAt: null,
      trialEndsAt: new Date(now.getTime() + 1),
    };
    expect(getCheckoutEligibility({ ...context, subscription }, now)).toEqual({ eligible: true, blockers: [] });
    expect(getCheckoutEligibility({ ...context, subscription: { ...subscription, trialEndsAt: now } }, now).eligible).toBe(true);
  });
});

describe('checkout resource limits', () => {
  const subscription = {
    planId: 'pro_plus',
    status: 'TRIAL' as const,
    deletedAt: null,
    lemonSubscriptionId: null,
    endsAt: null,
    trialEndsAt: new Date(now.getTime() + 1),
  };

  it('accepts exactly three professionals and thirty services for Pro', () => {
    expect(getCheckoutEligibility({ ...context, subscription, professionals: 3, services: 30 }, now)).toEqual({
      eligible: true,
      blockers: [],
    });
  });

  it('reports both exceeded resource caps without deleting resources', () => {
    expect(getCheckoutEligibility({ ...context, subscription, professionals: 4, services: 31 }, now).blockers).toEqual([
      expect.objectContaining({ code: 'PLAN_LIMIT_REACHED', resource: 'professionals', used: 4, limit: 3, excess: 1 }),
      expect.objectContaining({ code: 'PLAN_LIMIT_REACHED', resource: 'services', used: 31, limit: 30, excess: 1 }),
    ]);
  });

  it('supports either paid plan in individual and team workspaces', () => {
    for (const plan of [PLANS.pro, PLANS.pro_plus]) {
      for (const workspaceType of ['INDIVIDUAL', 'TEAM'] as const) {
        const availablePlan = { ...plan, pricing: { MONTHLY: { ...plan.pricing.MONTHLY, lemonVariantId: '42' } } };
        expect(getCheckoutEligibility({ ...context, subscription, plan: availablePlan, workspaceType }, now).eligible).toBe(true);
      }
    }
  });
});
