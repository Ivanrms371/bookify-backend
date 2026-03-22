import { Injectable } from '@nestjs/common';
import { PlanType } from 'src/generated/prisma/enums';

export type DashboardFeatures = {
  analytics: boolean;
  revenue: boolean;
  clientGrowth: boolean;
  popularServices: boolean;
};

const PLAN_FEATURES: Record<PlanType, DashboardFeatures> = {
  FREE: {
    analytics: false,
    revenue: false,
    clientGrowth: false,
    popularServices: false,
  },
  PRO: {
    analytics: true,
    revenue: true,
    clientGrowth: true,
    popularServices: true,
  },
  TEAM: {
    analytics: true,
    revenue: true,
    clientGrowth: true,
    popularServices: true,
  },
};

@Injectable()
export class DashboardFeaturesService {
  getFeatures(planType: PlanType): DashboardFeatures {
    return PLAN_FEATURES[planType];
  }
  hasFeature(planType: PlanType, feature: keyof DashboardFeatures): boolean {
    return PLAN_FEATURES[planType][feature];
  }
}
