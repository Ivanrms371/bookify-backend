import { AvailabilityConfig } from './availability-config.type';
import { SlotStrategy } from './slots.type';

type Block = {
  startMinutes: number;
  endMinutes: number;
};

export type AppointmentsWithBlocks = {
  blocks: {
    staffId: string;
    startTime: Date;
    endTime: Date;
  }[];
};

export type ScheduleException = {
  isClosed: boolean;
  daysOfWeek: number[];
  endDate: Date;
  startDate: Date;
  blocks: Block[];
};

export type WorkingHour = {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
};

export type ResolvedSchedule = {
  startMinutes: number;
  endMinutes: number;
};

export type FindNextAvailableDateParams = {
  staffId: string;
  date: Date;
  strategy: SlotStrategy;
  serviceDuration: number;
  config: AvailabilityConfig;
};

export type ResolveBusyBlocksParams = {
  appointments: AppointmentsWithBlocks[];
};
