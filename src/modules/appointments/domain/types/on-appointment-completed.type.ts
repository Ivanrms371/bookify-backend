import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export interface OnAppointmentCompletedData {
  tenantId: string;
  employeeId: string;
  customerId: string;
  startTime: Date;
  revenue: Decimal;
  previousStatus: AppointmentStatus;
}
