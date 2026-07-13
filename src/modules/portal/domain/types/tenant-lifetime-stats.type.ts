import { Decimal } from '@prisma/client/runtime/client';

export interface TenantLifetimeStat {
  totalAppointments: number;
  totalRevenue: Decimal;
  totalCustomers: number;
  totalCancelled: number;
  totalCompleted: number;
  totalNoShow: number;
}
