import { Plan } from 'src/generated/prisma/client';

export type PublicPlan = Pick<
  Plan,
  | 'id'
  | 'name'
  | 'tagline'
  | 'billingCycle'
  | 'trialDays'
  | 'price'
  | 'compareAtPrice'
  | 'currency'
  | 'isPublic'
  | 'isFeatured'
  | 'sortOrder'
  | 'description'
  | 'features'
>;
