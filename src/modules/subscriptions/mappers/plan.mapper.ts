import type { Plan, PlanPrice } from '../plans.config';
import type { PlanDto, PlanPriceDto } from '../dto/billing-summary.dto';

const priceDto = (price: PlanPrice): PlanPriceDto => ({
  amount: price.price.toFixed(2),
  compareAtAmount: price.compareAtPrice === null ? null : price.compareAtPrice.toFixed(2),
  ...(price.equivalentMonthlyPrice !== undefined && { equivalentMonthlyAmount: price.equivalentMonthlyPrice.toFixed(2) }),
});

export function toPlanDto(plan: Plan): PlanDto {
  return {
    id: plan.id, title: plan.title, description: plan.description,
    features: [...plan.features], compatibleWorkspaces: [...plan.compatibleWorkspaces],
    currency: 'USD', limits: { professionals: plan.maxProfessionals, services: { kind: 'not_configured' } },
    pricing: { MONTHLY: priceDto(plan.pricing.MONTHLY), ...(plan.pricing.ANNUAL && { ANNUAL: priceDto(plan.pricing.ANNUAL) }) },
    isPopular: plan.isPopular, cta: plan.cta,
    availability: {
      MONTHLY: plan.id === 'free' || Boolean(plan.pricing.MONTHLY.lemonVariantId),
      ANNUAL: Boolean(plan.pricing.ANNUAL?.lemonVariantId),
    },
  };
}
