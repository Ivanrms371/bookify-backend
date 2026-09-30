import { CreatedByType } from 'src/generated/prisma/enums';

export interface AppointmentCreatedEvent {
  tenantId: string;
  userId?: string | null;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  customerId?: string | null;
  customerName: string;
  cancelUrl: string;
  rescheduleUrl: string;
  detailsUrl?: string;
  startAppointmentDate: Date;
  endAppointmentDate: Date;
  appointmentId: string;
  createdBy: CreatedByType;
}
