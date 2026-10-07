import type { CreateScheduleExceptionDto } from '../dto/create-schedule-exception.dto';
import { InvalidScheduleException } from '../exceptions/invalid-schedule-exception.exception';

export function validateException(dto: CreateScheduleExceptionDto) {
  const start = new Date(dto.startDate);
  const end = new Date(dto.endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    throw new InvalidScheduleException('La fecha de inicio debe ser anterior o igual a la fecha de fin');
  }
  if (!dto.professionalIds?.length || new Set(dto.professionalIds).size !== dto.professionalIds.length) {
    throw new InvalidScheduleException('Selecciona profesionales válidos sin duplicados');
  }
  if (dto.isClosed) return;
  if (!dto.intervals?.length) throw new InvalidScheduleException('Debes definir al menos un intervalo de trabajo');
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    dto.intervals.some((interval) => !time.test(interval.opensAt) || !time.test(interval.closesAt) || interval.opensAt >= interval.closesAt)
  ) {
    throw new InvalidScheduleException('Los horarios deben tener horas válidas y apertura anterior al cierre');
  }
  const intervals = [...dto.intervals].sort((a, b) => a.opensAt.localeCompare(b.opensAt));
  if (intervals.some((interval, index) => index > 0 && interval.opensAt < intervals[index - 1].closesAt)) {
    throw new InvalidScheduleException('Los horarios no pueden superponerse');
  }
}
