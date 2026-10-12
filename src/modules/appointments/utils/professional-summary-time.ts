import { formatInTimeZone } from 'date-fns-tz';
import { localMinuteInstant, nextLocalDate } from 'src/shared/schedule/local-date';
export { localMinuteInstant, shiftLocalDate, nextLocalDate } from 'src/shared/schedule/local-date';

export function allowedSummaryTime(nominal: Date, timeZone: string): Date {
  const localDate = formatInTimeZone(nominal, timeZone, 'yyyy-MM-dd');
  const localMinute = Number(formatInTimeZone(nominal, timeZone, 'H')) * 60 + Number(formatInTimeZone(nominal, timeZone, 'm'));
  if (localMinute < 8 * 60) return localMinuteInstant(localDate, 8 * 60, timeZone);
  if (localMinute >= 21 * 60) return localMinuteInstant(nextLocalDate(localDate), 8 * 60, timeZone);
  return nominal;
}

export function morningSummaryDue(date: string, opensAt: number, timeZone: string): Date {
  const nominal = new Date(localMinuteInstant(date, opensAt, timeZone).getTime() - 60 * 60_000);
  return allowedSummaryTime(nominal, timeZone);
}

export function minuteLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
