export interface AppointmentCancelledEvent {
  appointmentId: string;
  businessId: string;
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
