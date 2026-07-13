export interface AppointmentCancelledEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  cancellationReason: string;
  cancelledAt: Date;
}

export interface AppointmentCancelledByEmployeeEvent {
  appointmentId: string;
  tenantId: string;
  userId: string;
  employeeName: string;
  customerName: string;
  startTime: Date;
  reason?: string;
}
