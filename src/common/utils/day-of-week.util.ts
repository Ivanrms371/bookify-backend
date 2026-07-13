import { DAY_OF_WEEK_TO_INT, INT_TO_DAY_OF_WEEK } from '../constants/day-of-week.constants';

export type DayOfWeek = keyof typeof DAY_OF_WEEK_TO_INT;

export function dayOfWeekToInt(day: DayOfWeek): number {
  return DAY_OF_WEEK_TO_INT[day];
}

export function intToDayOfWeek(day: number): string {
  return INT_TO_DAY_OF_WEEK[day as keyof typeof INT_TO_DAY_OF_WEEK];
}
