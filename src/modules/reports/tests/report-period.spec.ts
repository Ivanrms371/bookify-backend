import { resolveReportScope, shiftCalendarDay } from '../utils/report-period';

describe('report calendar ranges', () => {
  const now = new Date('2026-10-06T02:00:00Z'); // Still October 5 in Montevideo.

  it('uses tenant today and compares a partial month with the same elapsed days in the previous month', () => {
    const scope = resolveReportScope('tenant', {}, 'America/Montevideo', 'UYU', now);
    expect(scope.period).toMatchObject({ startDate: '2026-10-01', endDate: '2026-10-05', previousStartDate: '2026-09-01', previousEndDate: '2026-09-05' });
    expect(scope.start.toISOString()).toBe('2026-10-01T03:00:00.000Z');
    expect(scope.endExclusive.toISOString()).toBe('2026-10-06T03:00:00.000Z');
  });

  it.each([
    ['2026-10-06', '2026-09-01', '2026-09-06'],
    ['2026-01-01', '2025-12-01', '2025-12-01'],
    ['2026-03-31', '2026-02-01', '2026-02-28'],
    ['2024-03-31', '2024-02-01', '2024-02-29'],
  ])('aligns month progress and clamps shorter previous months: %s', (today, previousStartDate, previousEndDate) => {
    const scope = resolveReportScope('tenant', {}, 'UTC', 'USD', new Date(`${today}T12:00:00Z`));
    expect(scope.period).toMatchObject({ endDate: today, previousStartDate, previousEndDate });
    expect(scope.previousEndExclusive.toISOString().slice(0, 10)).toBe(shiftCalendarDay(previousEndDate, 1));
  });

  it('resolves last month across a year boundary', () => {
    const scope = resolveReportScope('tenant', { period: 'last-month' }, 'UTC', 'USD', new Date('2026-01-15T12:00:00Z'));
    expect(scope.period).toMatchObject({ startDate: '2025-12-01', endDate: '2025-12-31', previousStartDate: '2025-11-01', previousEndDate: '2025-11-30' });
  });

  it('compares a leap-year custom range with the immediately preceding equal-length range', () => {
    const scope = resolveReportScope('tenant', { period: 'custom', startDate: '2024-02-28', endDate: '2024-03-01' }, 'UTC', 'UYU', now);
    expect(scope.period).toMatchObject({ previousStartDate: '2024-02-25', previousEndDate: '2024-02-27' });
  });

  it.each([
    ['2026-03-08', 23],
    ['2025-11-02', 25],
  ])('uses actual local-day boundaries on DST day %s', (date, hours) => {
    const scope = resolveReportScope('tenant', { period: 'custom', startDate: date, endDate: date }, 'America/New_York', 'USD', now);
    expect((scope.endExclusive.getTime() - scope.start.getTime()) / 3600000).toBe(hours);
  });

  it.each([
    { period: 'custom' as const },
    { period: 'custom' as const, startDate: '2026-10-04', endDate: '2026-10-01' },
    { period: 'custom' as const, startDate: '2026-10-01', endDate: '2026-10-06' },
    { period: 'custom' as const, startDate: '2024-01-01', endDate: '2025-01-01' },
    { period: 'this-month' as const, startDate: '2026-10-01' },
  ])('rejects invalid or unsupported ranges %j', (query) => {
    expect(() => resolveReportScope('tenant', query, 'America/Montevideo', 'UYU', now)).toThrow();
  });
});
