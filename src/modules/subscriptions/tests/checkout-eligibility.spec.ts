import { getCheckoutEligibility } from '../checkout-eligibility';
import { PLANS } from '../plans.config';

const now = new Date('2026-10-02T12:00:00Z');
const context = {
  plan: { ...PLANS.pro, pricing: { MONTHLY: { ...PLANS.pro.pricing.MONTHLY, lemonVariantId: '42' } } },
  cycle: 'MONTHLY' as const,
  workspaceType: 'INDIVIDUAL' as const,
  professionals: 1,
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
  it('keeps trial checkout blocked before the boundary and permits it at expiry', () => {
    const subscription = {
      planId: 'pro_plus',
      status: 'TRIAL' as const,
      deletedAt: null,
      lemonSubscriptionId: null,
      endsAt: null,
      trialEndsAt: new Date(now.getTime() + 1),
    };
    expect(getCheckoutEligibility({ ...context, subscription }, now).blockers).toEqual([
      expect.objectContaining({ code: 'TRIAL_PAYMENT_POLICY_PENDING' }),
    ]);
    expect(getCheckoutEligibility({ ...context, subscription: { ...subscription, trialEndsAt: now } }, now).eligible).toBe(true);
  });
});
