import type { AppointmentStatus } from 'src/generated/prisma/enums';
import type { Prisma } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

export interface StatsAppointment {
  id: string;
  professionalId: string;
  customerId: string | null;
  status: AppointmentStatus;
  startsAt: Date;
  price: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
}

export interface AppointmentTotals {
  appointments: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  revenue: Prisma.Decimal;
  newCustomers: number;
}

export interface AppointmentMutationContext {
  tx: TransactionClient;
  afterCommit: (event: string, payload: unknown) => void;
}

export interface PendingAppointmentEvent {
  name: string;
  payload: unknown;
}
