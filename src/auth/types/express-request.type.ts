import { Request } from 'express';
import { MembershipRole } from 'src/generated/prisma/enums';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
  tenantContext: TenantContext;
};

export type AuthUser = {
  id: string;
  name: string;
  jti: string;
};

export type TenantContext = {
  tenantId: string | null;
  tenantSlug: string | null;
  role: MembershipRole | null;
  permissions: string[];
};
