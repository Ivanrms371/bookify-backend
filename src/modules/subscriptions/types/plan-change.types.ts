import type { Subscription } from 'src/generated/prisma/client';
import type { BillingCycle, Plan, PlanId, WorkspaceType } from '../plans.config';
import type { CheckoutEligibilityDto } from '../dto/checkout.dto';

export type SubscriptionPlanState = Subscription;
export interface PlanChangeEligibilityDto extends CheckoutEligibilityDto {
  kind: 'upgrade' | 'downgrade' | 'cycle' | 'undo' | 'free' | null;
  usage?: { professionals: number; services: number };
  limits?: { professionals: number; services: number };
  endsTrial?: boolean;
  effectiveAt: string | null;
  chargeImmediately: boolean;
}
export interface PlanChangeResultDto {
  state: 'confirmed' | 'pending';
  planId: string;
  pendingPlanId: string | null;
  pendingBillingCycle: BillingCycle | null;
  planChangesAt: string | null;
}
export interface PlanSelection {
  planId: PlanId;
  cycle: BillingCycle;
}
export interface PlanChangeSelection {
  planId: PlanId;
  cycle?: BillingCycle;
}

export interface PlanChangeEligibilityContext {
  local: SubscriptionPlanState;
  selection: PlanSelection;
  target: Plan;
  tenant: { workspaceType: WorkspaceType | null };
  usage: { professionals: number; services: number };
}
