export function calculateTrend(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100.00%' : '0.00%';
  }
  const percent = ((current - previous) / previous) * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
}
