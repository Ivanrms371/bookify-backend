export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type TimeInterval = {
  opens: string;
  closes: string;
};

export type BusinessHour = {
  day: DayOfWeek;
  isActive: boolean;
  intervals: TimeInterval[];
};

export type WorkingHourInterval = {
  start: string;
  end: string;
};

export type WorkingHour = {
  day: DayOfWeek;
  isActive: boolean;
  intervals: WorkingHourInterval[];
};

export type DbWorkingHour = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
};
