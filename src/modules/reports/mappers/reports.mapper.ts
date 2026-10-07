import type {
  ReportFilterOptions,
  ReportFilterOptionsResponse,
  ReportOverviewData,
  ReportOverviewResponse,
  ReportPeriodMetadata,
  ReportSettings,
} from '../types/reports.types';
import { fillReportRevenueDays } from '../utils/report-daily-revenue';

export function mapReportOverview(data: ReportOverviewData, period: ReportPeriodMetadata): ReportOverviewResponse {
  return {
    period: { ...period },
    summary: {
      current: { revenue: data.summary.current.revenue, completed: data.summary.current.completed },
      previous: { revenue: data.summary.previous.revenue, completed: data.summary.previous.completed },
    },
    dailyRevenue: fillReportRevenueDays(data.dailyRevenue, period),
    topServices: data.topServices.map(({ id, name, completed, revenue }) => ({ id, name, completed, revenue })),
    professionals: data.professionals.map(({ id, name, completed, revenue }) => ({ id, name, completed, revenue })),
    outcomes: data.outcomes.map(({ key, count }) => ({ key, count })),
  };
}

export function mapReportFilterOptions(options: ReportFilterOptions, settings: ReportSettings): ReportFilterOptionsResponse {
  return {
    services: options.services.map(({ id, name }) => ({ id, name })),
    professionals: options.professionals.map(({ id, name }) => ({ id, name })),
    timeZone: settings.timeZone,
    currency: settings.currency,
  };
}
