import { BusinessRole } from 'src/generated/prisma/enums';

export type GetMeWithBusiness = {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  businessMembers: {
    business: {
      id: string;
      name: string | null;
      slug: string | null;
      logoUrl: string | null;
      members: {
        role: string;
      }[];
    };
  }[];
};

export type GetMeUserMapper = {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  businesses: {
    id: string;
    name: string | null;
    slug: string | null;
    logoUrl: string | null;
    businessRole: BusinessRole;
  }[];
};
