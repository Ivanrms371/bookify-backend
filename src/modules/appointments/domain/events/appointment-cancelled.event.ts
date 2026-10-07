import { RecipientType } from 'src/generated/prisma/enums';

export interface AppointmentCancelledEvent {
  appointmentId: string;
  tenantId: string;
  userId: string | null;
  professionalId: string;
  professionalName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  cancellationReason: string;
  cancelledByName: string;
  cancelledBy: RecipientType;
}
