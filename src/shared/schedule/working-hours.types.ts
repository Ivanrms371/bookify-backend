import { DayOfWeek, DayOfWeekNumber } from 'src/common/constants/day-of-week.constants';

export type ScheduleExceptionIntervalInput = {
  dayOfWeek: DayOfWeek[];
  intervals: Interval[];
};

type Interval = {
  opensAt: string;
  closesAt: string;
};

export type WorkingHourInterval = {
  dayOfWeek: DayOfWeekNumber;
  opensAt: number;
  closesAt: number;
};
