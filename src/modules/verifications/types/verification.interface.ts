import { VerificationType } from 'src/generated/prisma/enums';

export interface CreateVerificationParams {
  userId: string;
  type: VerificationType;
  address: string;
  ip?: string;
  userAgent?: string;
}

export interface LockVerificationParams {
  userId: string;
  address: string;
  durationMinutes?: number;
}

export interface SendVerificationEmailParams {
  userId: string;
  email: string;
  name: string;
  ip?: string;
}
