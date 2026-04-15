export function toIsoDay(dateFnsDay: number): number {
  return dateFnsDay === 0 ? 6 : dateFnsDay - 1;
}

export function fromIsoDay(isoDay: number): number {
  return isoDay === 6 ? 0 : isoDay + 1;
}

export function getDayISO(date: Date): number {
  const jsDay = date.getDay();
  return (jsDay + 6) % 7;
}
