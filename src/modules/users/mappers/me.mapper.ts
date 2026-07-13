// src/auth/mappers/me.mapper.ts
import { UserMeRaw } from 'src/modules/users/types/user-me.types';
import { MeResponse, MeTenant, MeSubscription } from '../types/me-response.types';

function mapSubscription(subscription: UserMeRaw['memberships'][number]['tenant']['subscription']): MeSubscription | null {
  if (!subscription) return null;

  return {
    plan: subscription.plan?.name ?? null,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelledAt: subscription.cancelledAt,
    nextPaymentDate: subscription.nextPaymentDate,
  };
}

function mapTenant(membership: UserMeRaw['memberships'][number]): MeTenant {
  return {
    id: membership.tenant.id,
    name: membership.tenant.name,
    slug: membership.tenant.slug,
    logoUrl: membership.tenant.logoUrl,
    role: membership.role,
    membershipStatus: membership.status,
    onboardingStatus: membership.tenant.onboardingStatus,
    isActive: membership.tenant.isActive,
    subscription: mapSubscription(membership.tenant.subscription),
  };
}

export function mapMeResponse(raw: UserMeRaw): MeResponse {
  const tenantMembership = raw.memberships[0];
  console.log(tenantMembership);
  return {
    user: {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      avatarUrl: raw.avatarUrl,
    },
    tenant: tenantMembership ? mapTenant(tenantMembership) : null,
  };
}
