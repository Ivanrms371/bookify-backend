import type { Prisma } from 'src/generated/prisma/client';

export type DeliveryResolution = {
  deliveryId: string;
  tenantId?: string | null;
  outcome: 'accepted' | 'not-accepted';
  source: 'worker' | 'cron' | 'manual';
  operator: string;
  evidence: string;
  providerId?: string;
  acceptedAt?: Date;
};
export type ResolutionResult = { deliveryId: string; status: 'SENT' | 'FAILED'; changed: boolean };
export type ReconciliationStats = { checked: number; resolved: number; unresolved: number; withoutProviderId: number };
export type ResendAcceptance = { id: string; acceptedAt?: Date };
export type ReconciliationCommand = {
  command: 'list' | 'inspect' | 'resolve';
  tenantId: string;
  deliveryId?: string;
  after?: string;
  limit: number;
  resolution?: DeliveryResolution;
};
export type ReconciliationDelivery = Prisma.NotificationDeliveryGetPayload<{
  include: { notification: true; usageReservation: true };
}>;
