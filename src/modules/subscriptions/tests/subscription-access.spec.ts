import type { Subscription } from 'src/generated/prisma/client';
import { getSubscriptionAccess } from '../subscription-access';

const now = new Date('2026-10-02T12:00:00Z');
const record = (data: Partial<Subscription>) =>
  ({
    deletedAt: null,
    planId: 'pro_plus',
    status: 'TRIAL',
    trialEndsAt: new Date(now.getTime() + 1),
    endsAt: null,
    ...data,
  }) as Subscription;

describe('subscription access projection', () => {
  it('expires exactly at the trial boundary without changing stored status', () => {
    expect(getSubscriptionAccess(record({}), false, now).state).toBe('trial');
    const subscription = record({ trialEndsAt: now });
    expect(getSubscriptionAccess(subscription, false, now)).toMatchObject({ state: 'restricted', reason: 'TRIAL_ENDED', canUseApp: false });
    expect(subscription.status).toBe('TRIAL');
  });
  it('keeps cancelled access only until the paid end', () => {
    expect(getSubscriptionAccess(record({ status: 'CANCELLED', endsAt: new Date(now.getTime() + 1) }), true, now).canUseApp).toBe(true);
    expect(getSubscriptionAccess(record({ status: 'CANCELLED', endsAt: now }), true, now).canUseApp).toBe(false);
  });
  it('returns recoverable missing access without financial fields', () => {
    expect(getSubscriptionAccess(null, false, now)).toMatchObject({ reason: 'SUBSCRIPTION_REQUIRED', canManageBilling: false });
    expect(getSubscriptionAccess(record({}), false, now)).not.toHaveProperty('amount');
  });
  it.each(['PAUSED', 'PAST_DUE'] as const)('does not invent access policy for %s', (status) => {
    expect(getSubscriptionAccess(record({ status }), true, now)).toMatchObject({ state: 'policy_pending', canUseApp: null });
  });
});
