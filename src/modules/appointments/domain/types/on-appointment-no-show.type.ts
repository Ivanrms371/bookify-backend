import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export type OnAppointmentNoShowData = {
  employeeId: string;
  customerId: string;
  tenantId: string;
  startTime: Date;
  previousStatus: AppointmentStatus;
  revenue: Decimal;
};
