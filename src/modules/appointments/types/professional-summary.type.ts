import type { TimeRange } from 'src/modules/availability/types/slots.types';
import type { ProfessionalSummaryRepository } from '../repositories/professional-summary.repository';

export type ProfessionalSummaryCandidate = Awaited<ReturnType<ProfessionalSummaryRepository['findCandidates']>>[number];
export type ProfessionalSummaryVariables = {
  professionalName: string;
  date: string;
  count: number;
  firstTime: string;
  workingHours: string;
  agendaPath?: string;
  agendaUrl?: string;
};

export type ProfessionalSummarySchedule = {
  dayStart: Date;
  dayEnd: Date;
  ranges: TimeRange[];
};

export type ProfessionalEveningSummaryVariables = {
  professionalName: string;
  date: string;
  businessDate: string;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  unresolvedCount: number;
  completedValue: string;
  currency: string;
  snapshotTime: string;
  agendaPath?: string;
  agendaUrl?: string;
  professionalId: string;
};
export type ProfessionalDayOutcomes = Awaited<ReturnType<ProfessionalSummaryRepository['getDayOutcomes']>>;
