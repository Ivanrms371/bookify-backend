import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export interface OnAppointmentCancelledData {
  tenantId: string;
  employeeId: string;
  customerId: string;
  startTime: Date;
  isCustomerFault: boolean;
  previousStatus: AppointmentStatus;
  revenue: Decimal;
}
