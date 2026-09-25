import { format } from 'date-fns-tz';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);

  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1439) {
    throw new Error(`Invalid minutes: ${minutes}`);
  }

  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');

  return `${h}:${m}`;
}

export function dateToMinutesTz(date: Date, timeZone: string): number {
  const hours = parseInt(format(date, 'H', { timeZone }), 10);
  const minutes = parseInt(format(date, 'm', { timeZone }), 10);

  return hours * 60 + minutes;
}
