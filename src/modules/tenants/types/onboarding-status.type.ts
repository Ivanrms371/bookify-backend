import { Decimal } from '@prisma/client/runtime/client';

export interface TenantInput {
  id: string;
  name: string | null;
  slug: string | null;
  type: string | null;
  description: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  phoneNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  onboardingCompleted: boolean;
  subscription?: {
    id: string;
    planId: string;
    status: string;
    trialEndsAt: Date | null;
    plan?: { id: string; name: string; professionalLimit: number } | null;
  } | null;
  tenantWorkingHours?: {
    id: string;
    dayOfWeek: number;
    isActive: boolean;
    opensAt: number;
    closesAt: number;
  }[];
  services?: {
    id: string;
    name: string;
    price: Decimal;
    durationMinutes: number;
    isActive: boolean;
    deletedAt?: Date | null;
  }[];
  members?: {
    id: string;
    role: string;
    status: string;
    userId: string;
  }[];
}

export interface OnboardingStatusResponse {
  data: {
    tenant: Omit<TenantInput, 'subscription' | 'tenantWorkingHours' | 'services' | 'members'>;
    subscription: {
      id: string;
      planId: string;
      status: string;
      trialEndsAt: Date | null;
      plan: { id: string; name: string } | null;
    } | null;
    tenantWorkingHours: {
      id: string;
      dayOfWeek: number;
      isActive: boolean;
      opensAt: number;
      closesAt: number;
    }[];
    services: {
      id: string;
      name: string;
      price: Decimal;
      durationMinutes: number;
      isActive: boolean;
    }[];
    memberships: {
      id: string;
      role: string;
      status: string;
      userId: string;
    }[];
  };
  currentStep: number;
  steps: { id: string; label: string }[];
}
