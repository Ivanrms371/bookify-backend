import { Request } from 'express';
import { MembershipRole } from 'src/generated/prisma/enums';
import { Role } from '../constants/role-permissions.constants';
import { Permission } from '../constants/permissions.constant';

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
  permissions: readonly Permission[];
};
