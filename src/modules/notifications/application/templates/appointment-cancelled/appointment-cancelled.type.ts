import { RecipientType } from 'src/generated/prisma/enums';

export type AppointmentCancelledVariables = {
  audience?: 'CUSTOMER' | 'PROFESSIONAL';
  customerName: string;
  professionalName: string;
  date: string;
  time: string;
  appointmentId: string;
  detailsUrl?: string;
  cancelledBy?: RecipientType;
  cancelledByName?: string;
  cancellationReason?: string;
};
