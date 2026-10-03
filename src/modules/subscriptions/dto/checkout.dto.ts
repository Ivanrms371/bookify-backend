import { IsEnum, IsIn } from 'class-validator';
import { BillingCycle } from 'src/generated/prisma/enums';
import type { PlanId } from '../plans.config';

export class CheckoutSelectionDto {
  @IsIn(['free', 'pro', 'pro_plus'])
  planId: PlanId;

  @IsEnum(BillingCycle)
  cycle: BillingCycle;
}

export interface CheckoutBlocker {
  code: string;
  message: string;
  resource?: 'professionals' | 'workspace' | 'provider' | 'cycle';
  used?: number;
  limit?: number;
  excess?: number;
}
export interface CheckoutEligibilityDto {
  eligible: boolean;
  blockers: CheckoutBlocker[];
}
