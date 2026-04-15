import { MembershipRole } from 'src/generated/prisma/enums';

export type GetMeWithTenant = {
  id: string;
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
};

export type GetMeUserMapper = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  tenants: {
    id: string;
    name: string | null;
    slug: string | null;
    logoUrl: string | null;
    membership: MembershipRole;
    subscription: {
      status: string;
      plan: string;
      trialEndsAt: string | null;
      currentPeriodEnd: string | null;
      cancelledAt: string | null;
    };
  }[];
};
