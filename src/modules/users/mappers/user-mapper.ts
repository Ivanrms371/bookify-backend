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
        currentPeriodEnd: Date | null;
        trialEndsAt: Date | null;
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
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
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
  static toDomain(raw: RawUserContextResponse, tenantId?: string): UserSessionContext {
    const memberships = raw.memberships || [];

    const activeMembership = tenantId ? memberships.find((m) => m.tenant.id === tenantId) || memberships[0] : memberships[0];

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
              trialEndsAt: tenant.subscription?.trialEndsAt?.toISOString() ?? null,
              currentPeriodEnd: tenant.subscription?.currentPeriodEnd?.toISOString() ?? null,
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

type WorkingHoursRow = { dayOfWeek: number; opensAt: number; closesAt: number };

export class ProfileMapper {
  // Professionals without their own hours fall back to the tenant's schedule
  private static toScheduleDto(professional: any) {
    const own: WorkingHoursRow[] = professional.workingHours ?? [];
    const tenant: WorkingHoursRow[] = professional.tenant?.tenantWorkingHours ?? [];
    const usesTenantSchedule = own.length === 0;
    const rows = usesTenantSchedule ? tenant : own;

    return {
      usesTenantSchedule,
      workingHours: rows.map(({ dayOfWeek, opensAt, closesAt }) => ({ dayOfWeek, opensAt, closesAt })),
    };
  }

  static toProfileDto(user: any) {
    const professional = user.professional || null;
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
        avatarUrl: user.avatarUrl,
        phoneVerifiedAt: user.phoneVerifiedAt ?? null,
        hasPassword: Boolean(user.password),
        hasGoogle: Boolean(user.googleId),
        createdAt: user.createdAt,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate,
        bio: user.bio,
        professional: professional ? {
          id: professional.id,
          name: professional.name,
          email: professional.email,
          phoneCountryCode: professional.phoneCountryCode,
          phoneNumber: professional.phoneNumber,
          isActive: professional.isActive,
          profession: professional.profession,
          bio: professional.bio,
          avatarUrl: professional.avatarUrl,
          colorTheme: professional.colorTheme,
          slotIntervalMinutes: professional.slotIntervalMinutes,
          maxAdvancedDays: professional.maxAdvancedDays,
          minAdvancedMinutes: professional.minAdvancedMinutes,
          ...ProfileMapper.toScheduleDto(professional),
        } : null,
      }
    };
  }
}
