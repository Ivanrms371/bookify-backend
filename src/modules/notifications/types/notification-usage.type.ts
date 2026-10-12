import type { NotificationChannel } from 'src/generated/prisma/enums';

export type UsageReservation = {
  usageId: string;
  channel: NotificationChannel;
  state: 'RESERVED' | 'CONFIRMED' | 'RELEASED';
  ambiguous: boolean;
};
