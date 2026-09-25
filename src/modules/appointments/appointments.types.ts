export interface CreatePublicParams {
  tenantId: string;
  serviceId: string;
  professionalId: string;
  startsAt: string;
  customerName: string;
  customerPhoneCode: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
}

export interface ReschedulePublicParams {
  startsAt: string;
  rescheduleReason?: string;
}

export interface CancelPublicParams {
  cancellationReason?: string;
}
