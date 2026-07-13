export interface AppointmentCreatedEvent {
  tenantId: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  cancelUrl: string;
  rescheduleUrl: string;
  startAppointmentDate: Date;
  endAppointmentDate: Date;
  appointmentId: string;
  createdBy: 'EMPLOYEE' | 'CUSTOMER';
}
