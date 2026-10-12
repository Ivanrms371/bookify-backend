import type { RecipientType } from 'src/generated/prisma/enums';

export interface AppointmentCancelledEvent {
  appointmentId: string;
  tenantId: string;
  cancellationReason: string;
  cancelledByName: string;
  cancelledBy: RecipientType;
}
