import { DayOfWeek } from '../constants/day-of-week.constants';

export type Schedule = {
  isActive: boolean;
  intervals: TimeInterval[];
};

export type TimeInterval = {
  opens: string;
  closes: string;
};

export type WeeklySchedule = Record<DayOfWeek, Schedule>;

export type ValidateOverlapInput = {
  dayOfWeek: number;
  intervals: Interval[];
};

export type Interval = {
  opensAt: number;
  closesAt: number;
};
