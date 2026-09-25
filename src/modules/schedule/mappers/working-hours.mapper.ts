import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { timeToMinutes } from 'src/common/utils/time.util';
import { WorkingHourInterval } from '../types/working-hours.types';

export function mapWorkingHoursToIntervals(workingHours: any, tenantId: string): WorkingHourInterval[] {
  const dayOfWeek = dayOfWeekToInt(workingHours.dayOfWeek);

  return workingHours.intervals.map((interval) => ({
    tenantId,
    dayOfWeek,
    opensAt: timeToMinutes(interval.opensAt),
    closesAt: timeToMinutes(interval.closesAt),
  }));
}
