export interface TenantDailyStat {
  date: Date;
  revenue: number;
  appointments: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  newCustomers: number;
}
