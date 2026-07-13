// src/auth/types/me-response.types.ts

import { MembershipRole, MembershipStatus, OnboardingStatus } from 'src/generated/prisma/enums';

export interface MeSubscription {
  plan: string | null;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  nextPaymentDate: Date | null;
}

export interface MeTenant {
  id: string;
  name: string | null;
  slug: string | null;
  logoUrl: string | null;
  role: MembershipRole;
  membershipStatus: MembershipStatus;
  onboardingStatus: OnboardingStatus;
  isActive: boolean;
  subscription: MeSubscription | null;
}

export interface MeUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface MeResponse {
  user: MeUser;
  tenant: MeTenant | null;
}
