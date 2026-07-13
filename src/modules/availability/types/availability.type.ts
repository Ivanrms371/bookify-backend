import { AvailabilityConfig } from './availability-config.type';
import { SlotStrategy } from './slots.type';

type Block = {
  opensAt: number;
  closesAt: number;
};

export type AppointmentsWithBlocks = {
  blocks: {
    employeeId: string;
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
  opensAt: number;
  closesAt: number;
};

export type ResolvedSchedule = {
  opensAt: number;
  closesAt: number;
};

export type FindNextAvailableDateParams = {
  employeeId: string;
  date: Date;
  strategy: SlotStrategy;
  serviceDuration: number;
  config: AvailabilityConfig;
};

export type ResolveBusyBlocksParams = {
  appointments: AppointmentsWithBlocks[];
};
