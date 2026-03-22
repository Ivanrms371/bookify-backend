import { Request } from 'express';
import { BusinessRole } from 'src/generated/prisma/enums';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
  member: BusinessMember;
};

export type AuthUser = {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  tokenVersion: number;
  jti: string;
  deviceId: string;
};

export type BusinessMember = {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessRole;
};
