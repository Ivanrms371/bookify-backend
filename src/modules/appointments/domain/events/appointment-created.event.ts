export interface AppointmentCreatedEvent {
  tenantId: string;
  userId: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  cancelUrl: string;
  rescheduleUrl: string;
  startAppointmentDate: Date;
  endAppointmentDate: Date;
  appointmentId: string;
  createdBy: 'STAFF' | 'CUSTOMER';
}
