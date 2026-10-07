import { IsIn, ValidateBy, isEnum } from 'class-validator';
import { BillingCycle } from 'src/generated/prisma/enums';
import type { PlanId } from '../plans.config';

export class PlanChangeSelectionDto {
  @IsIn(['free', 'pro', 'pro_plus'])
  planId: PlanId;

  @ValidateBy({
    name: 'planChangeCycle',
    validator: {
      validate: (value, args) =>
        (args?.object as PlanChangeSelectionDto).planId === 'free' ? value === undefined : isEnum(value, BillingCycle),
      defaultMessage: () => 'Free has no billing cycle; paid plans require MONTHLY or ANNUAL.',
    },
  })
  cycle?: BillingCycle;
}
