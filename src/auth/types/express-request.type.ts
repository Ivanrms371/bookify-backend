import { Decimal } from '@prisma/client/runtime/client';
import { Request } from 'express';
import { MembershipRole, PlanType } from 'src/generated/prisma/enums';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
  tenant: Tenant;
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

export type Membership = {
  id: string;
  userId: string;
  tenantId: string;
  role: MembershipRole;
};

export type Staff = {
  id: string;
  name: string;
  commissionPercent: Decimal | null;
}

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  subscription: Subscription;
  membership: Membership;
  staff: Staff;
}

export type Subscription = {
  id: string;
  plan: Plan;
}

export type Plan = {
  id: string;
  planType: PlanType;
  isActive: boolean;
  limits: Limits
}

export type Limits = {
  professionalLimit: number;
  appointmentLimit: number;
  emailLimit: number;
  whatsappLimit: number;
}