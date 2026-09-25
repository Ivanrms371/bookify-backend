import { addMinutes, differenceInMinutes, format, parse } from 'date-fns';
import { DayOfWeek, BusinessHour, WorkingHour, TimeInterval, DbWorkingHour } from './schedule.types';

const BASE_DATE = new Date(2000, 0, 1, 0, 0, 0);

/**
 * Converts minutes from midnight (e.g. 540) to "HH:mm" (e.g. "09:00") using date-fns.
 */
export function minutesToTime(minutes: number): string {
  return format(addMinutes(BASE_DATE, minutes), 'HH:mm');
}

/**
 * Converts a "HH:mm" string (e.g. "09:00") to minutes from midnight (e.g. 540) using date-fns.
 */
export function timeToMinutes(time: string): number {
  const parsed = parse(time, 'HH:mm', BASE_DATE);
  return differenceInMinutes(parsed, BASE_DATE);
}

export const DAYS_OF_WEEK_ORDER: readonly DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const DAY_TO_INT_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const INT_TO_DAY_MAP: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

/**
 * Formats database working hours array into frontend business hours format (all 7 days included).
 * Converts minutes (e.g. 540) to time string (e.g. '09:00') and groups by day.
 */
export function formatWorkingHoursForFrontend(dbWorkingHours: DbWorkingHour[] = []): BusinessHour[] {
  const groupedByDay = new Map<DayOfWeek, TimeInterval[]>();

  for (const day of DAYS_OF_WEEK_ORDER) {
    groupedByDay.set(day, []);
  }

  const sorted = [...(dbWorkingHours || [])].sort((a, b) => a.opensAt - b.opensAt);

  for (const item of sorted) {
    const day = INT_TO_DAY_MAP[item.dayOfWeek];
    if (day) {
      groupedByDay.get(day)?.push({
        opens: minutesToTime(item.opensAt),
        closes: minutesToTime(item.closesAt),
      });
    }
  }

  return DAYS_OF_WEEK_ORDER.map((day) => {
    const intervals = groupedByDay.get(day) ?? [];
    return {
      day,
      isActive: intervals.length > 0,
      intervals,
    };
  });
}

/**
 * Formats frontend business hours or working hours into database representation.
 * Converts time strings (e.g. '09:00') to minutes from midnight (e.g. 540) and day to integer.
 */
export function formatWorkingHoursForBackend(
  businessHours: Array<
    | BusinessHour
    | WorkingHour
    | { day: DayOfWeek; isActive?: boolean; intervals: Array<{ opens?: string; closes?: string; start?: string; end?: string }> }
  >,
): DbWorkingHour[] {
  const result: DbWorkingHour[] = [];

  for (const item of businessHours) {
    if (item.isActive === false) {
      continue;
    }

    const dayOfWeek = DAY_TO_INT_MAP[item.day];
    if (dayOfWeek === undefined) {
      continue;
    }

    for (const interval of item.intervals) {
      const opens = 'opens' in interval && interval.opens ? interval.opens : (interval as { start?: string }).start;
      const closes = 'closes' in interval && interval.closes ? interval.closes : (interval as { end?: string }).end;

      if (!opens || !closes) {
        continue;
      }

      result.push({
        dayOfWeek,
        opensAt: timeToMinutes(opens),
        closesAt: timeToMinutes(closes),
      });
    }
  }

  return result.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.opensAt - b.opensAt);
}
