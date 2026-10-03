import type { Subscription } from 'src/generated/prisma/client';
import type { BillingSummaryDto } from '../dto/billing-summary.dto';
import type { Plan } from '../plans.config';
import { getSubscriptionAccess } from '../subscription-access';
import { toPlanDto } from './plan.mapper';

export function toBillingSummaryDto(
  subscription: Subscription | null,
  plan: Plan | undefined,
  usage: BillingSummaryDto['usage'],
): BillingSummaryDto {
  const hasPortal = Boolean(subscription?.lemonCustomerId);
  return {
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          cycle: subscription.billingCycle,
          amount: subscription.amount?.toFixed(2) ?? null,
          currency: subscription.currency,
          trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          endsAt: subscription.endsAt?.toISOString() ?? null,
          cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
          paymentMethod: subscription.paymentMethod,
          pendingPlanId: subscription.pendingPlanId ?? null,
          pendingBillingCycle: subscription.pendingBillingCycle ?? null,
          planChangesAt: subscription.planChangesAt?.toISOString() ?? null,
        }
      : null,
    currentPlan: plan ? toPlanDto(plan) : null,
    access: getSubscriptionAccess(subscription, true),
    usage,
    allowedActions: {
      explorePlans: true,
      manageSubscription: hasPortal,
      cancelSubscription: hasPortal && subscription?.status !== 'CANCELLED',
    },
  };
}
