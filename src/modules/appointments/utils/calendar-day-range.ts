import { fromZonedTime } from 'date-fns-tz';

// Exclusive next-day boundary handles both 23-hour and 25-hour business days.
export function calendarDayRange(calendarDate: string, timeZone: string) {
  const nextDay = new Date(`${calendarDate}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return {
    gte: fromZonedTime(`${calendarDate}T00:00:00`, timeZone),
    lt: fromZonedTime(`${nextDay.toISOString().slice(0, 10)}T00:00:00`, timeZone),
  };
}
