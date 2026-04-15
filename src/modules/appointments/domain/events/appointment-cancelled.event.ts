export interface AppointmentCancelledEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  staffId: string;
  staffName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  cancellationReason: string;
  cancelledAt: Date;
}

export interface AppointmentCancelledByStaffEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  staffName: string;
  customerName: string;
  startTime: Date;
  reason?: string;
}
