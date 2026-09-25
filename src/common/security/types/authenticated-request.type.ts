import { Request } from 'express';
import { MembershipRole } from 'src/generated/prisma/enums';

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
  tenantContext: TenantContext;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  jti: string;
};

export type TenantContext = {
  tenantId: string | null;
  tenantSlug: string | null;
  role: MembershipRole;
  permissions: string[];
};
