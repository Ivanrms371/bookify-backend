import { Prisma } from 'src/generated/prisma/client';
import type { SubscriptionPlanState } from '../types/plan-change.types';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';

export const freeActivation = {
  planId: 'free',
  status: 'ACTIVE' as const,
  amount: new Prisma.Decimal(0),
  billingCycle: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  endsAt: null,
  cancelledAt: null,
  cancelReason: null,
  paymentMethod: null,
  paymentProvider: null,
  pendingPlanId: null,
  pendingBillingCycle: null,
  planChangesAt: null,
  planChangeUndoRequestedAt: null,
};

export function projectFreeProviderState(local: SubscriptionPlanState, current: LemonSqueezySubscriptionData, now = new Date()) {
  // Keep the historical provider binding for invoices, without reactivating its expired paid plan.
  if (local.planId === 'free' && local.status === 'ACTIVE') return {};
  const attrs = current.attributes;
  const cancelled = attrs.cancelled && ['cancelled', 'expired'].includes(attrs.status);
  const end = attrs.ends_at ? new Date(attrs.ends_at) : null;
  const active = attrs.status === 'active' && !attrs.cancelled && !attrs.ends_at;
  if (local.planChangeUndoRequestedAt) {
    if (cancelled && end && end <= now) return freeActivation;
    if (!active) return {};
    return {
      status: 'ACTIVE' as const,
      cancelledAt: null,
      endsAt: null,
      pendingPlanId: null,
      pendingBillingCycle: null,
      planChangesAt: null,
      planChangeUndoRequestedAt: null,
    };
  }
  if (cancelled && end && Number.isFinite(end.getTime())) {
    if (end <= now) return freeActivation;
    return {
      status: 'CANCELLED' as const,
      cancelledAt: local.cancelledAt ?? now,
      endsAt: end,
      pendingPlanId: 'free',
      pendingBillingCycle: null,
      planChangesAt: end,
      planChangeUndoRequestedAt: null,
    };
  }
  // An external portal resumption cancels a previously confirmed schedule. A pre-cancellation
  // snapshot must not erase an intent with an unconfirmed deadline.
  if (active && local.planChangesAt)
    return {
      status: 'ACTIVE' as const,
      cancelledAt: null,
      endsAt: null,
      pendingPlanId: null,
      pendingBillingCycle: null,
      planChangesAt: null,
      planChangeUndoRequestedAt: null,
    };
  return {};
}
