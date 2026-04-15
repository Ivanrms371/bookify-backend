import { MembershipRole } from 'src/generated/prisma/enums';
import { GetMeUserMapper, GetMeWithTenant } from '../types/get-me.type';

interface UserWithTenant {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  memberships: {
    tenant: {
      id: string;
      name: string | null;
      slug: string | null;
      logoUrl: string | null;
      members: {
        role: string;
      }[];
      subscription: {
        status: string;
        trialEndsAt: Date | null;
        currentPeriodEnd: Date | null;
        cancelledAt: Date | null;
        plan: {
          planType: string;
        };
      } | null;
    };
  }[];
}

export class UserMapper {
  static toMeResponse(user: GetMeWithTenant): GetMeUserMapper {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenants: user.memberships.map((bm) => ({
        id: bm.tenant.id,
        name: bm.tenant.name,
        slug: bm.tenant.slug,
        logoUrl: bm.tenant.logoUrl,
        membership: bm.tenant.members[0].role as MembershipRole,
        subscription: bm.tenant.subscription ? {
           status: bm.tenant.subscription.status,
           plan: bm.tenant.subscription.plan.planType,
           trialEndsAt: bm.tenant.subscription.trialEndsAt?.toISOString() ?? null,
           currentPeriodEnd: bm.tenant.subscription.currentPeriodEnd?.toISOString() ?? null,
           cancelledAt: bm.tenant.subscription.cancelledAt?.toISOString() ?? null,
        } : { 
           status: 'TRIAL', 
           plan: 'Free',
           trialEndsAt: null,
           currentPeriodEnd: null,
           cancelledAt: null,
        },
      })),
    };
  }
}
