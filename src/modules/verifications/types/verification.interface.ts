import { VerificationType } from 'src/generated/prisma/enums';

export interface CreateVerificationParams {
  userId: string;
  type: VerificationType;
  address: string;
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
}

export interface RequestResetPasswordParams {
  userId: string;
  email: string;
  name: string;
}
