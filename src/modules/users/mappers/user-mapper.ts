import { MembershipRole, OnboardingStatus, SubscriptionStatus } from 'src/generated/prisma/enums';

export interface RawUserContextResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  memberships: Array<{
    role: MembershipRole;
    tenant: {
      id: string;
      name: string | null;
      slug: string | null;
      logoUrl: string | null;
      onboardingStatus: OnboardingStatus;
      professionals: Array<{ id: string }>;
      subscription: {
        status: SubscriptionStatus;
        plan: { name: string };
      } | null;
    };
  }>;
}

export interface ActiveTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: MembershipRole;
  onboardingStatus: OnboardingStatus;
  professionalId: string | null;
  subscription: {
    status: SubscriptionStatus;
    planName: string;
  } | null;
}

export interface UserSessionContext {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  activeTenant: ActiveTenant | null;
  hasMultipleTenants: boolean;
}

export class MeUserMapper {
  static toDomain(raw: RawUserContextResponse, preferredTenantSlug?: string): UserSessionContext {
    const memberships = raw.memberships || [];

    const activeMembership = preferredTenantSlug
      ? memberships.find((m) => m.tenant.slug === preferredTenantSlug) || memberships[0]
      : memberships[0];

    let activeTenant: ActiveTenant | null = null;

    if (activeMembership) {
      const { tenant, role } = activeMembership;
      const professionalId = tenant.professionals?.[0]?.id || null;

      activeTenant = {
        id: tenant.id,
        name: tenant.name ?? 'Sin nombre',
        slug: tenant.slug ?? '',
        logoUrl: tenant.logoUrl,
        role,
        onboardingStatus: tenant.onboardingStatus,
        professionalId,
        subscription: tenant.subscription
          ? {
              status: tenant.subscription.status,
              planName: tenant.subscription.plan.name,
            }
          : null,
      };
    }

    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      avatarUrl: raw.avatarUrl,
      activeTenant,
      hasMultipleTenants: memberships.length > 1,
    };
  }
}
