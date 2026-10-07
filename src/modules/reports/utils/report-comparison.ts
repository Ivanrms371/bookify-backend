export function dashboardTrend(current: number, previous: number): string {
  if (previous <= 0) return '';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

export function appointmentsDailyTrend(current: number, previous: number | undefined): string {
  if (previous === undefined) return '';
  const difference = current - previous;
  if (difference === 0) return 'Igual que ayer';
  return `${Math.abs(difference)} ${difference > 0 ? 'más' : 'menos'} que ayer`;
}
