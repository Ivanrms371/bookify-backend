import type { ResolvedPlanVariant } from './types/resolved-plan-variant.types';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { toPlanDto } from './mappers/plan.mapper';
import { PLANS } from './plans.config';
import type { BillingCycle, Plan, PlanId } from './types/plan.types';

@Injectable()
export class PlansService {
  private readonly plans = PLANS;

  /**
   * Retrieves a specific plan by its unique identifier.
   */
  getPlan(planId: PlanId): Plan {
    const plan = this.plans[planId];
    if (!plan) {
      throw new NotFoundException(`Plan "${planId}" does not exist.`);
    }
    return plan;
  }

  /**
   * Returns all available plans sorted by their display order.
   */
  getCatalog() {
    return this.getAllPlans().map(toPlanDto);
  }

  getAllPlans(): Plan[] {
    return Object.values(this.plans).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Every workspace receives the same Pro+ trial. */
  resolveTrialPlan(): Plan {
    return this.getPlan('pro_plus');
  }

  /**
   * Returns the Lemon Squeezy variant ID associated with a specific plan and billing cycle.
   */
  getVariantId(planId: PlanId, cycle: BillingCycle = 'MONTHLY'): string {
    const plan = this.getPlan(planId);
    const priceConfig = plan.pricing[cycle];

    if (!priceConfig?.lemonVariantId) {
      throw new BadRequestException(`No Lemon Squeezy variant configured for plan "${planId}" with billing cycle "${cycle}".`);
    }

    return priceConfig.lemonVariantId;
  }

  /**
   * Reverse-lookups a plan configuration, billing cycle, and price by Lemon Squeezy variant ID.
   * Useful when processing asynchronous webhook payloads.
   */
  resolvePlanByVariantId(variantId: string): ResolvedPlanVariant {
    for (const plan of Object.values(this.plans)) {
      for (const [cycleKey, priceConfig] of Object.entries(plan.pricing)) {
        if (priceConfig?.lemonVariantId === variantId) {
          return {
            planId: plan.id,
            cycle: cycleKey as BillingCycle,
            price: priceConfig.price,
            plan,
          };
        }
      }
    }

    throw new NotFoundException(`No registered plan matches Lemon Squeezy variant ID "${variantId}".`);
  }
}
