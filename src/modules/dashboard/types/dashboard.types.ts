import type { AppointmentStatus } from 'src/generated/prisma/enums';

export interface DashboardChartEntry {
  date: string;
  revenue: number;
  appointments: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  newCustomers: number;
}

export interface DashboardStatItem {
  current: number;
  trend: string;
}

export interface DashboardStats {
  revenue: DashboardStatItem;
  appointmentsToday: DashboardStatItem;
  newCustomers: DashboardStatItem;
  totalCustomers: { current: number };
}

export interface DashboardAppointmentProfessional {
  id: string;
  avatarUrl: string | null;
  displayName: string | null;
  colorTheme: string | null;
}

export interface DashboardUpcomingAppointment {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  customerName: string;
  confirmationCode: string;
  durationMinutes: number;
  professional: DashboardAppointmentProfessional;
  service?: {
    name: string;
    price: number;
  };
}

export interface DashboardOverviewResponse {
  chart: DashboardChartEntry[];
  stats: DashboardStats;
  upcomingAppointments: DashboardUpcomingAppointment[];
}
