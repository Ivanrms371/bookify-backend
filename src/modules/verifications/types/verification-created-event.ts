import type { VerificationType, RecipientType, NotificationChannel } from 'src/generated/prisma/enums';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
export interface VerificationCreatedEvent {
  verificationId: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  token?: string;
  invitationToken?: string;
  code?: string;
  expiresAt: Date;
  tenantId?: string;
  channel?: NotificationChannel;
  phone?: string | null;
  email?: string | null;
  tx?: TransactionClient;
}
