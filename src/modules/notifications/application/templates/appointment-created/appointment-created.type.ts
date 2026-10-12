export interface AppointmentCreatedVariables {
  professionalName: string;
  audience?: 'CUSTOMER' | 'PROFESSIONAL';
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  appointmentId: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  detailsUrl?: string;
  createdBy?: 'CUSTOMER' | 'STAFF';
}
