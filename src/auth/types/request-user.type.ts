import { StaffRole } from 'src/generated/prisma/enums';

export type AuthenticatedRequestUser = {
  userId: string;
  email: string | null;
  phone: string | null;
  tokenVersion: number;
};

export type AuthenticatedRequestStaff = {
  staffId: string;
  businessId: string;
  role: StaffRole;
};
