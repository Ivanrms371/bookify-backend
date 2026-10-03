import type { Subscription } from 'src/generated/prisma/client';
import type { SubscriptionAccessDto } from './dto/billing-summary.dto';

// A read-only projection. Operational enforcement is a later implementation slice.
export function getSubscriptionAccess(subscription: Subscription | null, canManageBilling: boolean, now = new Date()): SubscriptionAccessDto {
  const base = {
    canManageBilling, trialEndsAt: subscription?.trialEndsAt?.toISOString() ?? null,
    accessEndsAt: subscription?.endsAt?.toISOString() ?? null,
  };
  const restricted = (reason: string): SubscriptionAccessDto => ({
    ...base, state: 'restricted', reason, effectivePlanId: null, canUseApp: false,
  });
  if (!subscription || subscription.deletedAt) return restricted('SUBSCRIPTION_REQUIRED');
  if (subscription.status === 'TRIAL') {
    if (!subscription.trialEndsAt || subscription.trialEndsAt <= now) return restricted('TRIAL_ENDED');
    return { ...base, state: 'trial', reason: null, effectivePlanId: subscription.planId, canUseApp: true };
  }
  if (subscription.status === 'ACTIVE' || (subscription.status === 'CANCELLED' && subscription.endsAt && subscription.endsAt > now)) {
    return { ...base, state: 'enabled', reason: null, effectivePlanId: subscription.planId, canUseApp: true };
  }
  if (subscription.status === 'PAST_DUE' || subscription.status === 'PAUSED') {
    return { ...base, state: 'policy_pending', reason: subscription.status, effectivePlanId: null, canUseApp: null };
  }
  return restricted(subscription.status === 'SUSPENDED' ? 'SUBSCRIPTION_SUSPENDED' : 'SUBSCRIPTION_EXPIRED');
}
