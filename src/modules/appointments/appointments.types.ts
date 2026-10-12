export interface CreatePublicParams {
  customerId: string;
  tenantId: string;
  serviceId: string;
  professionalId: string;
  startsAt: string;
  notes?: string;
}

export interface ReschedulePublicParams {
  startsAt: string;
  rescheduleReason?: string;
}

export interface CancelPublicParams {
  cancellationReason?: string;
}
