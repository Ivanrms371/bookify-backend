import type { ReportOverviewData, ReportPeriodMetadata } from '../types/reports.types';
import { TZDate } from '@date-fns/tz';
import { eachDayOfInterval, format } from 'date-fns';

export function fillReportRevenueDays(
  rows: ReportOverviewData['dailyRevenue'],
  period: ReportPeriodMetadata,
): ReportOverviewData['dailyRevenue'] {
  const revenueByDay = new Map(rows.map((row) => [row.date, row.revenue]));
  return eachDayOfInterval({
    start: new TZDate(`${period.startDate}T00:00:00Z`, 'UTC'),
    end: new TZDate(`${period.endDate}T00:00:00Z`, 'UTC'),
  }).map((day) => {
    const date = format(day, 'yyyy-MM-dd');
    return { date, revenue: revenueByDay.get(date) ?? 0 };
  });
}
