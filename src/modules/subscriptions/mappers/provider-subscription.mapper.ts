import { BadRequestException } from '@nestjs/common';
import type { SubscriptionStatus } from 'src/generated/prisma/enums';
import type { LemonSqueezySubscriptionStatus } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy.types';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import type { BillingCycle, PlanId } from '../plans.config';

const PROVIDER_STATUSES: Record<LemonSqueezySubscriptionStatus, SubscriptionStatus> = {
  active: 'ACTIVE',
  on_trial: 'TRIAL',
  past_due: 'PAST_DUE',
  unpaid: 'PAST_DUE',
  cancelled: 'CANCELLED',
  expired: 'EXPIRED',
  paused: 'PAUSED',
};

export function toProviderSubscriptionUpdate(
  subscription: LemonSqueezySubscriptionData,
  plan: { planId: PlanId; cycle: BillingCycle; price: number },
  cancelledAt?: Date | null,
) {
  const attrs = subscription.attributes;
  const status = Object.hasOwn(PROVIDER_STATUSES, attrs.status) ? PROVIDER_STATUSES[attrs.status] : undefined;
  if (!status) throw new BadRequestException('Unknown provider subscription status.');
  return {
    lemonCustomerId: String(attrs.customer_id),
    status,
    planId: plan.planId,
    billingCycle: plan.cycle,
    amount: plan.price,
    currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : attrs.ends_at ? new Date(attrs.ends_at) : null,
    trialEndsAt: attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
    endsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
    cancelledAt: attrs.cancelled || attrs.status === 'cancelled' ? (cancelledAt ?? new Date(attrs.updated_at)) : null,
    paymentMethod: attrs.card_brand && attrs.card_last_four ? `${attrs.card_brand} **** ${attrs.card_last_four}` : null,
  };
}
