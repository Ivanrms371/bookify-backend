import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export interface OnAppointmentCancelledData {
  tenantId: string;
  professionalId: string;
  customerId: string;
  startsAt: Date;
  isCustomerFault: boolean;
  previousStatus: AppointmentStatus;
  revenue: Decimal;
}
