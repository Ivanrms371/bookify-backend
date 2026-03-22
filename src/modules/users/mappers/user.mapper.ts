import { BusinessRole } from 'src/generated/prisma/enums';
import { GetMeUserMapper, GetMeWithBusiness } from '../types/get-me.type';

interface UserWithBusiness {
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
}

export class UserMapper {
  static toMeResponse(user: GetMeWithBusiness): GetMeUserMapper {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      businesses: user.businessMembers.map((bm) => ({
        id: bm.business.id,
        name: bm.business.name,
        slug: bm.business.slug,
        logoUrl: bm.business.logoUrl,
        businessRole: bm.business.members[0].role as BusinessRole,
      })),
    };
  }
}
