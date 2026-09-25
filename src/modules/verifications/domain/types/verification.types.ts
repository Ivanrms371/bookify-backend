import { RecipientType, VerificationType } from 'src/generated/prisma/enums';

export interface CreatedVerification {
  id: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  expiresAt: Date;
}

export interface VerifiedChallenge {
  id: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
}
