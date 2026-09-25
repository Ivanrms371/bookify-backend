import { DAY_OF_WEEK_TO_INT, INT_TO_DAY_OF_WEEK, DayOfWeek, DayOfWeekNumber } from '../constants/day-of-week.constants';

export function dayOfWeekToInt(day: DayOfWeek): DayOfWeekNumber {
  return DAY_OF_WEEK_TO_INT[day];
}

export function intToDayOfWeek(day: DayOfWeekNumber): DayOfWeek {
  return INT_TO_DAY_OF_WEEK[day];
}
