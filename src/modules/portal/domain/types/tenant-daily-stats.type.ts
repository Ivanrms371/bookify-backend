import { Decimal } from '@prisma/client/runtime/client';

export interface TenantDailyStat {
  date: Date;
  revenue: Decimal;
  appointments: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  newCustomers: number;
}
