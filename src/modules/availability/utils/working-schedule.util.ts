import type { WeeklyWorkingHours, WorkingScheduleException } from '../types/working-schedule.type';
import type { TimeRange } from '../types/slots.types';

export function resolveWorkingHours(
  tenantHours: WeeklyWorkingHours[],
  professionalHours: WeeklyWorkingHours[],
  dayOfWeek: number,
): TimeRange[] {
  return (professionalHours.length ? professionalHours : tenantHours).filter((hours) => hours.dayOfWeek === dayOfWeek);
}

export function resolveScheduleExceptions(exceptions: WorkingScheduleException[], dayStart: Date, dayEnd: Date) {
  const active = exceptions.filter((exception) => exception.startDate <= dayEnd && exception.endDate >= dayStart);
  return {
    isFullyClosed: active.some((exception) => exception.isClosed),
    exceptionBlocks: active.flatMap((exception) => exception.blocks.map(({ opensAt, closesAt }) => ({ opensAt, closesAt }))),
  };
}

export function normalizeWorkingRanges(ranges: TimeRange[]): TimeRange[] {
  const sorted = ranges.map((range) => ({ ...range })).sort((a, b) => a.opensAt - b.opensAt);
  const merged: TimeRange[] = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.opensAt <= previous.closesAt) previous.closesAt = Math.max(previous.closesAt, range.closesAt);
    else merged.push(range);
  }
  return merged;
}
