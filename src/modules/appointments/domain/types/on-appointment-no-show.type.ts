import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export type OnAppointmentNoShowData = {
  professionalId: string;
  customerId: string;
  tenantId: string;
  startsAt: Date;
  previousStatus: AppointmentStatus;
  revenue: Decimal;
};
