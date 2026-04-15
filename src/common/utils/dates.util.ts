import { format, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'America/Montevideo';

export const generateEndDate = (months: number = 12) => {
  const today = new Date();
  const endDate = new Date(today.setMonth(today.getMonth() + months));
  return endDate;
};

export const getToday = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export function getYesterday(): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

/**
 * Returns the start of the day for a given date in a specific timezone.
 * Useful for grouping stats by day according to the business's timezone.
 */
export function getZonedStartOfDay(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
  const zonedDate = toZonedTime(date, timeZone);
  return startOfDay(zonedDate);
}

/**
 * Formats a date to 'yyyy-MM-dd' ignoring timezone shifts (UTC date part).
 */
export function formatToDayKey(date: Date): string {
  // Use toISOString to always get the UTC date part consistently
  return date.toISOString().split('T')[0];
}

