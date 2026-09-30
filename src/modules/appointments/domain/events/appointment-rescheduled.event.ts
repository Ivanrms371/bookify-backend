import { RecipientType } from 'src/generated/prisma/enums';

export interface AppointmentRescheduledEvent {
  appointmentId: string;
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
  previousStartsAt: Date;
  previousEndsAt: Date;
  startsAt: Date;
  endsAt: Date;
  rescheduleReason?: string;
  rescheduledByName: string;
  rescheduledBy: RecipientType;
}
