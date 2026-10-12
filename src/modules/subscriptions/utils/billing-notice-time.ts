import { formatInTimeZone } from 'date-fns-tz';
import { localMinuteInstant, shiftLocalDate } from 'src/shared/schedule/local-date';

export function billingNoticeWindow(eventAt: Date, offset: number, timeZone: string) {
  const dueDate = shiftLocalDate(formatInTimeZone(eventAt, timeZone, 'yyyy-MM-dd'), -offset);
  return { dueDate, dueAt: localMinuteInstant(dueDate, 540, timeZone), expiresAt: localMinuteInstant(dueDate, 1260, timeZone) };
}

export function billingTimeZone(value?: string | null): string {
  const zone = value || 'America/Montevideo';
  new Intl.DateTimeFormat('es-UY', { timeZone: zone }).format();
  return zone;
}
