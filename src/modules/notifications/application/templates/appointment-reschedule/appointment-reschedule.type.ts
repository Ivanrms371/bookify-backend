import type { RecipientType } from 'src/generated/prisma/enums';

export type AppointmentRescheduledVariables = {
  audience?: 'CUSTOMER' | 'PROFESSIONAL';
  customerName: string;
  appointmentId: string;
  detailsUrl?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  serviceName: string;
  professionalName: string;
  previousDate?: string;
  previousTime?: string;
  date: string;
  time: string;
  rescheduleReason?: string;
  rescheduledByName?: string;
  rescheduledBy?: RecipientType;
};
