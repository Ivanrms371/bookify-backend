import { freeActivation, projectFreeProviderState } from './utils/free-transition';
import type { SubscriptionPlanState } from './types/plan-change.types';
import { PLANS } from './plans.config';
import type {
  LemonSqueezyInvoiceData,
  LemonSqueezySubscriptionData,
} from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import { toProviderSubscriptionUpdate } from './mappers/provider-subscription.mapper';
import type { ResolvedPlanVariant } from './types/resolved-plan-variant.types';
import type { PlanId } from './plans.config';

export function planRank(planId: string): number {
  return PLANS[planId as PlanId]?.sortOrder ?? 0;
}

export function isPendingUpgrade(subscription: SubscriptionPlanState): boolean {
  return Boolean(subscription.pendingPlanId && planRank(subscription.pendingPlanId) > planRank(subscription.planId));
}

export function isPendingDowngrade(subscription: SubscriptionPlanState): boolean {
  return Boolean(subscription.pendingPlanId && planRank(subscription.pendingPlanId) < planRank(subscription.planId));
}

export function isPendingCycleChange(subscription: SubscriptionPlanState): boolean {
  return Boolean(
    subscription.pendingPlanId === subscription.planId &&
    subscription.pendingBillingCycle &&
    subscription.pendingBillingCycle !== subscription.billingCycle,
  );
}

export function isPendingScheduledChange(subscription: SubscriptionPlanState): boolean {
  return isPendingDowngrade(subscription) || isPendingCycleChange(subscription);
}

// Reads must reflect expiry even before the next webhook or scheduled database update.
export function projectDuePlanChange(subscription: SubscriptionPlanState, now = new Date()): SubscriptionPlanState {
  if (!isPendingScheduledChange(subscription) || !subscription.planChangesAt || subscription.planChangesAt > now) {
    return subscription;
  }
  if (subscription.pendingPlanId === 'free') {
    return !subscription.planChangeUndoRequestedAt ? { ...subscription, ...freeActivation } : subscription;
  }
  const plan = PLANS[subscription.pendingPlanId as PlanId];
  const cycle = subscription.pendingBillingCycle ?? subscription.billingCycle;
  return {
    ...subscription,
    planId: plan.id,
    billingCycle: cycle,
    pendingPlanId: null,
    pendingBillingCycle: null,
    planChangesAt: null,
  };
}

export function confirmsUpgradePayment(
  local: SubscriptionPlanState,
  current: LemonSqueezySubscriptionData,
  invoice: LemonSqueezyInvoiceData | null,
): boolean {
  if (!isPendingUpgrade(local) || !local.planChangesAt || !invoice) {
    return false;
  }
  const payment = invoice.attributes;
  const expectedCustomer = local.lemonCustomerId;
  const belongsToSubscription = String(payment.subscription_id) === current.id && String(payment.customer_id) === expectedCustomer;
  const isUpgradeInvoice = payment.billing_reason === 'updated' || payment.billing_reason === 'renewal';
  // Provider timestamps may have second precision. Old invoices from earlier requests cannot unlock an upgrade.
  const requestedAt = Math.floor(local.planChangesAt.getTime() / 1000) * 1000;
  return belongsToSubscription && isUpgradeInvoice && payment.status === 'paid' && Date.parse(payment.created_at) >= requestedAt;
}

export function projectProviderPlanChange(
  local: SubscriptionPlanState,
  current: LemonSqueezySubscriptionData,
  target: ResolvedPlanVariant,
  upgradePaid: boolean,
  now = new Date(),
) {
  if (local.pendingPlanId === 'free' || (local.planId === 'free' && local.status === 'ACTIVE')) {
    return projectFreeProviderState(local, current, now);
  }
  const update = toProviderSubscriptionUpdate(current, target, local.cancelledAt);
  const keepCurrentPlan = {
    ...update,
    planId: local.planId,
    amount: local.amount,
    billingCycle: local.billingCycle,
    ...(isPendingCycleChange(local) ? { currentPeriodEnd: local.currentPeriodEnd } : {}),
  };
  const clearPending = { pendingPlanId: null, pendingBillingCycle: null, planChangesAt: null, planChangeUndoRequestedAt: null };
  if (target.planId === local.planId) {
    if (target.cycle !== local.billingCycle) {
      const matchesRequest = local.pendingPlanId === target.planId && local.pendingBillingCycle === target.cycle;
      if (!matchesRequest) {
        return keepCurrentPlan;
      }
      const deadline = local.planChangesAt ?? local.currentPeriodEnd;
      if (!deadline) {
        return keepCurrentPlan;
      }
      if (deadline <= now) {
        return { ...update, ...clearPending };
      }
      // A cycle switch must preserve the already paid renewal date.
      if (Date.parse(current.attributes.renews_at ?? '') !== deadline.getTime()) {
        return keepCurrentPlan;
      }
      return { ...keepCurrentPlan, planChangesAt: deadline };
    }
    // Old lifecycle snapshots must not erase a requested cycle switch.
    if (isPendingCycleChange(local)) {
      return keepCurrentPlan;
    }
    return local.pendingPlanId && !isPendingUpgrade(local) ? { ...update, ...clearPending } : update;
  }
  if (planRank(target.planId) > planRank(local.planId)) {
    const matchesRequest = local.pendingPlanId === target.planId && local.pendingBillingCycle === target.cycle;
    return upgradePaid && matchesRequest ? { ...update, ...clearPending } : keepCurrentPlan;
  }
  // A confirmed lower provider variant retains the original deadline, including after an unconfirmed undo.
  const pendingDeadline = local.pendingPlanId && !isPendingUpgrade(local) ? local.planChangesAt : null;
  const deadline = pendingDeadline ?? local.currentPeriodEnd;
  if (!deadline) {
    return keepCurrentPlan;
  }
  if (deadline <= now) {
    return { ...update, ...clearPending };
  }
  return { ...keepCurrentPlan, pendingPlanId: target.planId, pendingBillingCycle: target.cycle, planChangesAt: deadline };
}
