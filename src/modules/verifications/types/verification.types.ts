import type { RecipientType, VerificationType } from 'src/generated/prisma/enums';

export interface GeneratedVerificationCode {
  code: string;
  hash: string;
}

export interface RequestVerificationInput {
  recipientId: string;
  recipientType: RecipientType;
  type: VerificationType;
  tenantId?: string;
}

export interface VerifyTokenInput {
  token: string;
  type: VerificationType;
}

export interface VerifyCodeInput {
  verificationId: string;
  code: string;
}

export type ConsumeVerificationInput = VerifyTokenInput | VerifyCodeInput;

export interface CreatedVerification {
  id: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  tenantId: string | null;
  expiresAt: Date;
}

export interface VerifiedChallenge {
  id: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  tenantId: string | null;
  destination: string | null;
}

export type VerificationFailureReason = 'not-found' | 'used' | 'expired' | 'locked' | 'wrong-code';

export type ConsumeVerificationResult =
  | { success: true; verification: VerifiedChallenge }
  | { success: false; reason: VerificationFailureReason };
