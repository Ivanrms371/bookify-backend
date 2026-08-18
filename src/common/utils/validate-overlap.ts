import { Interval, ValidateOverlapInput } from '../types/schedule.types';

export const validateOverlaps = (inputs: ValidateOverlapInput[]): boolean => {
  const grouped = new Map<number, Interval[]>();
  for (const input of inputs) {
    const intervals = grouped.get(input.dayOfWeek) ?? [];

    intervals.push(...input.intervals);
    grouped.set(input.dayOfWeek, intervals);
  }

  for (const intervals of grouped.values()) {
    if (!validateOverlapping(intervals)) {
      return false;
    }
  }
  return true;
};

export const validateOverlapping = (intervals: Interval[]): boolean => {
  intervals.sort((a, b) => a.opensAt - b.opensAt);

  for (let i = 0; i < intervals.length - 1; i++) {
    const current = intervals[i];
    const next = intervals[i + 1];

    if (current.closesAt > next.opensAt) {
      return false;
    }
  }

  return true;
};
