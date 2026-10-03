import type { Subscription } from 'src/generated/prisma/client';
import type { BillingCycle, Plan, WorkspaceType } from '../plans.config';

export type CheckoutSubscription = Pick<Subscription, 'planId' | 'status' | 'deletedAt' | 'lemonSubscriptionId' | 'endsAt' | 'trialEndsAt'>;
export interface CheckoutEligibilityContext {
  plan: Plan;
  cycle: BillingCycle;
  workspaceType: WorkspaceType | null;
  subscription: CheckoutSubscription | null;
  professionals: number;
  services: number;
}
