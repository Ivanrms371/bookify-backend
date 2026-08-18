import { minutesToTime } from 'src/common/utils/time/time.util';
import { RawScheduleException, ScheduleExceptionResponse } from '../types/schedule-exception-response.types';

export function toScheduleExceptionResponse(raw: RawScheduleException): ScheduleExceptionResponse {
  return {
    id: raw.id,
    startDate: raw.startDate,
    endDate: raw.endDate,
    isClosed: raw.isClosed,
    reason: raw.reason,
    blocks: raw.blocks.map((b) => ({
      opensAt: minutesToTime(b.opensAt),
      closesAt: minutesToTime(b.closesAt),
    })),
    professionals: raw.professionals.map((p) => ({
      professionalId: p.professionalId,
      displayName: p.professional.displayName,
    })),
  };
}
