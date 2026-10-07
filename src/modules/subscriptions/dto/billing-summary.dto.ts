import type { BillingCycle, Currency, SubscriptionStatus } from 'src/generated/prisma/enums';
import type { PlanId, WorkspaceType } from '../plans.config';

export interface PlanPriceDto {
  amount: string;
  compareAtAmount: string | null;
  equivalentMonthlyAmount?: string;
}
export interface PlanDto {
  id: PlanId;
  title: string;
  description: string;
  features: string[];
  currency: 'USD';
  compatibleWorkspaces: WorkspaceType[];
  limits: { professionals: number; services: number };
  pricing: { MONTHLY: PlanPriceDto; ANNUAL?: PlanPriceDto };
  isPopular: boolean;
  cta: string;
  availability: { MONTHLY: boolean; ANNUAL: boolean };
}
export interface SubscriptionAccessDto {
  state: 'trial' | 'enabled' | 'restricted' | 'policy_pending';
  reason: string | null;
  effectivePlanId: string | null;
  trialEndsAt: string | null;
  accessEndsAt: string | null;
  canUseApp: boolean | null;
  canManageBilling: boolean;
}
export interface BillingSummaryDto {
  subscription: {
    id: string;
    planId: string;
    status: SubscriptionStatus;
    cycle: BillingCycle | null;
    amount: string | null;
    currency: Currency;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    endsAt: string | null;
    cancelledAt: string | null;
    paymentMethod: string | null;
    planChangeUndoRequestedAt: string | null;
    pendingPlanId: string | null;
    pendingBillingCycle: BillingCycle | null;
    planChangesAt: string | null;
  } | null;
  currentPlan: PlanDto | null;
  access: SubscriptionAccessDto;
  usage: { professionals: number; services: number; countBasis: 'non_deleted' };
  allowedActions: { explorePlans: boolean; manageSubscription: boolean; cancelSubscription: boolean };
}
