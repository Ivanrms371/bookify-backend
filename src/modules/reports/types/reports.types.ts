export type ReportPeriod = 'this-month' | 'last-month' | 'custom';

export interface ReportQuery {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  serviceId?: string;
  topServicesLimit?: number;
}

export interface ReportPeriodMetadata {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  timeZone: string;
  currency: string;
}

export interface ReportScope {
  tenantId: string;
  professionalId?: string;
  serviceId?: string;
  topServicesLimit: number;
  period: ReportPeriodMetadata;
  start: Date;
  endExclusive: Date;
  previousStart: Date;
  previousEndExclusive: Date;
}

export interface ReportTotals {
  revenue: number;
  completed: number;
}

export interface ReportPerformanceRow {
  id: string;
  name: string;
  completed: number;
  revenue: number;
}

export interface ReportOverviewData {
  summary: { current: ReportTotals; previous: ReportTotals };
  dailyRevenue: { date: string; revenue: number }[];
  topServices: ReportPerformanceRow[];
  professionals: ReportPerformanceRow[];
  outcomes: { key: 'completed' | 'cancelled' | 'noShow' | 'pendingConfirmed'; count: number }[];
}

export interface ReportOverviewResponse extends ReportOverviewData {
  period: ReportPeriodMetadata;
}

export interface ReportFilterOptions {
  services: { id: string; name: string }[];
  professionals: { id: string; name: string }[];
}

export interface ReportSettings {
  timeZone: string;
  currency: string;
}

export interface ReportFilterOptionsResponse extends ReportFilterOptions, ReportSettings {}

export interface ReportAggregateQueryRow {
  data: ReportOverviewData;
}
