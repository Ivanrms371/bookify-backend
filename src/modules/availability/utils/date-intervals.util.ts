import { TimeRange } from '../types/slots.types';

/**
 * Retorna true si dos intervalos temporales se solapan.
 * Asume intervalos semiabiertos [startsAt, endsAt).
 */
export function areIntervalsOverlapping(a: TimeRange, b: TimeRange): boolean {
  return a.opensAt < b.closesAt && a.closesAt > b.opensAt;
}

/**
 * Retorna true si el intervalo candidato colisiona con cualquiera de la lista.
 */
export function hasConflict(candidate: TimeRange, busyIntervals: TimeRange[]): boolean {
  return busyIntervals.some((busy) => areIntervalsOverlapping(candidate, busy));
}

/**
 * Retorna true si el intervalo candidato está 100% contenido en al menos uno de los rangos operativos.
 */
export function isWithinOperationalRanges(candidate: TimeRange, operationalRanges: TimeRange[]): boolean {
  return operationalRanges.some((range) => candidate.opensAt >= range.opensAt && candidate.closesAt <= range.closesAt);
}
