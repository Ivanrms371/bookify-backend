import type { TimeRange } from './slots.types';

export type WeeklyWorkingHours = TimeRange & { dayOfWeek: number };
export type WorkingScheduleException = {
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  blocks: TimeRange[];
};
