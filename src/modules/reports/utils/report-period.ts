import { TZDate } from '@date-fns/tz';
import { addDays, addMonths, differenceInCalendarDays, format, startOfMonth } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { InvalidReportPeriodException } from '../exceptions/report.exceptions';
import type { ReportQuery, ReportScope } from '../types/reports.types';

// Calendar arithmetic uses UTC day keys; conversion to instants happens only at the query boundary.
export function shiftCalendarDay(day: string, offset: number): string {
  return format(addDays(new TZDate(`${day}T00:00:00Z`, 'UTC'), offset), 'yyyy-MM-dd');
}

function monthStart(day: string, offset: number): string {
  const date = new TZDate(`${day}T00:00:00Z`, 'UTC');
  return format(addMonths(startOfMonth(date), offset), 'yyyy-MM-dd');
}

export function resolveReportScope(tenantId: string, query: ReportQuery, timeZone: string, currency: string, now: Date): ReportScope {
  const today = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
  const period = query.period ?? 'this-month';
  let startDate: string;
  let endDate: string;
  let previousStartDate: string;
  let previousEndDate: string;

  if (period === 'custom') {
    if (!query.startDate || !query.endDate) throw new InvalidReportPeriodException('Selecciona las fechas Desde y Hasta.');
    startDate = query.startDate;
    endDate = query.endDate;
    const days = differenceInCalendarDays(new TZDate(`${endDate}T00:00:00Z`, 'UTC'), new TZDate(`${startDate}T00:00:00Z`, 'UTC')) + 1;
    if (!Number.isFinite(days) || days < 1 || days > 366) throw new InvalidReportPeriodException('El período debe tener entre 1 y 366 días.');
    if (endDate > today) throw new InvalidReportPeriodException('Hasta no puede ser posterior a hoy.');
    previousEndDate = shiftCalendarDay(startDate, -1);
    previousStartDate = shiftCalendarDay(startDate, -days);
  } else {
    if (query.startDate || query.endDate) throw new InvalidReportPeriodException('Las fechas Desde y Hasta requieren un período personalizado.');
    startDate = monthStart(today, period === 'last-month' ? -1 : 0);
    endDate = period === 'last-month' ? shiftCalendarDay(monthStart(today, 0), -1) : today;
    previousStartDate = monthStart(startDate, -1);
    previousEndDate = period === 'last-month'
      ? shiftCalendarDay(startDate, -1)
      : format(addMonths(new TZDate(`${today}T00:00:00Z`, 'UTC'), -1), 'yyyy-MM-dd');
  }

  return {
    tenantId,
    professionalId: query.professionalId,
    serviceId: query.serviceId,
    topServicesLimit: query.topServicesLimit ?? 4,
    period: { startDate, endDate, previousStartDate, previousEndDate, timeZone, currency },
    start: fromZonedTime(`${startDate}T00:00:00`, timeZone),
    endExclusive: fromZonedTime(`${shiftCalendarDay(endDate, 1)}T00:00:00`, timeZone),
    previousStart: fromZonedTime(`${previousStartDate}T00:00:00`, timeZone),
    previousEndExclusive: fromZonedTime(`${shiftCalendarDay(previousEndDate, 1)}T00:00:00`, timeZone),
  };
}
