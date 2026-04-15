import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export type OnAppointmentNoShowData = {
  staffId: string;
  customerId: string;
  tenantId: string;
  startTime: Date;
  previousStatus: AppointmentStatus;
  revenue: Decimal;
};
