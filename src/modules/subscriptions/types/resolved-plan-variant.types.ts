import type { BillingCycle, Plan, PlanId } from '../plans.config';
export interface ResolvedPlanVariant {
  planId: PlanId;
  cycle: BillingCycle;
  price: number;
  plan: Plan;
}
