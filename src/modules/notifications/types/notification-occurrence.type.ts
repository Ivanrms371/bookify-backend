import type { RecipientType } from 'src/generated/prisma/enums';
import type { Prisma } from 'src/generated/prisma/client';

export type NotificationOccurrenceInput = {
  type: string;
  tenantId: string;
  referenceId?: string;
  recipientId: string;
  recipientType: RecipientType;
  payload: Prisma.InputJsonValue;
  occurrenceKey: string;
  expiresAt: Date;
};
