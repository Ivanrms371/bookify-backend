import type { RecipientType } from 'src/generated/prisma/enums';

export interface AppointmentRescheduledEvent {
  appointmentId: string;
  tenantId: string;
  // The previous time and actor cannot be reconstructed from the current appointment.
  previousStartsAt: Date;
  rescheduleReason?: string;
  rescheduledByName: string;
  rescheduledBy: RecipientType;
}
