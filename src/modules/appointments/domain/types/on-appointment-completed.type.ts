import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export interface OnAppointmentCompletedData {
  tenantId: string;
  professionalId: string;
  customerId: string;
  startsAt: Date;
  revenue: Decimal;
  previousStatus: AppointmentStatus;
}
