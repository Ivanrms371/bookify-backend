import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function localMinuteInstant(date: string, minutes: number, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(new TZDate(year, month - 1, day, 0, minutes, 0, 0, timeZone).getTime());
}

export function shiftLocalDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return format(addDays(new Date(year, month - 1, day), days), 'yyyy-MM-dd');
}

export const nextLocalDate = (date: string): string => shiftLocalDate(date, 1);
