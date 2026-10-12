import type { SubscriptionUpdateInput } from 'src/generated/prisma/models';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import type { SubscriptionPlanState } from '../types/plan-change.types';

export function renewalProjection(current: LemonSqueezySubscriptionData) {
  const a = current.attributes;
  const renewal = a.renews_at ? new Date(a.renews_at) : null;
  return {
    nextRenewalAt:
      a.status === 'active' && !a.cancelled && !a.pause && !a.ends_at && renewal && Number.isFinite(renewal.getTime()) ? renewal : null,
    renewalCheckedAt: new Date(),
  };
}

export function canNotifyRenewal(local: SubscriptionPlanState, now: Date): boolean {
  return (
    local.status === 'ACTIVE' &&
    ['pro', 'pro_plus'].includes(local.planId) &&
    !local.deletedAt &&
    !!local.lemonSubscriptionId &&
    !local.cancelledAt &&
    !local.endsAt &&
    !local.pendingPlanId &&
    !local.pendingBillingCycle &&
    !local.planChangesAt &&
    !local.planChangeUndoRequestedAt &&
    !!local.nextRenewalAt &&
    local.nextRenewalAt > now
  );
}

export function invalidateRenewalForPendingChange(data: SubscriptionUpdateInput): SubscriptionUpdateInput {
  return data.pendingPlanId || data.pendingBillingCycle || data.planChangeUndoRequestedAt
    ? { ...data, nextRenewalAt: null, renewalCheckedAt: null }
    : data;
}
