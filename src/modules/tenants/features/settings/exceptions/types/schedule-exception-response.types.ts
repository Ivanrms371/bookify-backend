import type { DayOfWeek } from 'src/common/constants/day-of-week.constants';
import type { ScheduleExceptionGetPayload } from 'src/generated/prisma/models';

export const scheduleExceptionSelect = {
  id: true,
  reason: true,
  startDate: true,
  endDate: true,
  isClosed: true,
  blocks: {
    select: { opensAt: true, closesAt: true },
  },
  professionals: {
    select: {
      professionalId: true,
      professional: { select: { name: true } },
    },
  },
} as const;

export type RawScheduleException = ScheduleExceptionGetPayload<{
  select: typeof scheduleExceptionSelect;
}>;

// ─── Shared sub-types ─────────────────────────────────────────────────────────

export interface ScheduleExceptionBlockResponse {
  opensAt: string;
  closesAt: string;
}

export interface ScheduleExceptionProfessional {
  professionalId: string;
  name: string | null;
}

// ─── Unified response (findAll / findById / create / update) ─────────────────

export interface ScheduleExceptionResponse {
  id: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  reason: string | null;
  blocks: ScheduleExceptionBlockResponse[];
  professionals: ScheduleExceptionProfessional[];
}
