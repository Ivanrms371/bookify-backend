import { RecipientType } from 'src/generated/prisma/enums';

export type AppointmentCancelledVariables = {
  customerName: string;
  professionalName: string;
  date: string;
  time: string;
  appointmentId: string;
  cancelledBy?: RecipientType;
  cancelledByName?: string;
  cancellationReason?: string;
};
