import { getHours, getMinutes } from 'date-fns';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function dateToMinutes(date: Date): number {
  const hours = getHours(date);
  const minutes = getMinutes(date);
  return hours * 60 + minutes;
}
