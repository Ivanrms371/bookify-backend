export type WorkspaceType = 'INDIVIDUAL' | 'TEAM';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type PlanId = 'free' | 'pro' | 'pro_plus';

export interface PlanPrice {
  price: number;
  compareAtPrice: number | null;
  equivalentMonthlyPrice?: number;
  lemonVariantId?: string;
}

export interface Plan {
  id: PlanId;
  title: string;
  description: string;
  compatibleWorkspaces: WorkspaceType[];
  maxProfessionals: number;
  maxServices: number;
  features: string[];
  sortOrder: number;
  isPopular: boolean;
  cta: string;
  pricing: {
    MONTHLY: PlanPrice;
    ANNUAL?: PlanPrice;
  };
}
