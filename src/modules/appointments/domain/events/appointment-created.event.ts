import { RecipientType } from 'src/generated/prisma/enums';

export interface AppointmentCreatedEvent {
  tenantId: string;
  userId: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  cancelUrl: string;
  rescheduleUrl: string;
  startAppointmentDate: Date;
  endAppointmentDate: Date;
  appointmentId: string;
  createdBy: RecipientType;
}
