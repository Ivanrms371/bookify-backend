export interface AppointmentCancelledEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  professionalId: string;
  professionalName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  cancellationReason: string;
  cancelledAt: Date;
}

export interface AppointmentCancelledByProfessionalEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  professionalName: string;
  customerName: string;
  startsAt: Date;
  reason?: string;
}
