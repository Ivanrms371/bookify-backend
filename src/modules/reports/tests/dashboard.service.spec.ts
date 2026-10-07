import { DashboardService } from '../services/dashboard.service';
import { ReportMetricsRepository } from '../repositories/report-metrics.repository';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { ReportMetricsService } from '../services/report-metrics.service';

describe('Dashboard comparisons', () => {
  const repository = {
    findDailyStatsByDateRange: jest.fn(),
    findLifetimeStats: jest.fn().mockResolvedValue(null),
    findAppointmentsByDateRange: jest.fn().mockResolvedValue([]),
  };
  const service = new DashboardService(new ReportMetricsService(repository as unknown as ReportMetricsRepository), repository as unknown as DashboardRepository);
  const row = (date: Date, revenue: number) => ({ date, revenue, appointments: 0, confirmed: 0, cancelled: 0, completed: 0, noShow: 0, newCustomers: 0 });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 31, 12));
    repository.findDailyStatsByDateRange.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it.each([
    [150, 100, '+50.00%'],
    [50, 100, '-50.00%'],
    [100, 100, '+0.00%'],
    [0, 100, '-100.00%'],
    [100, 0, ''],
    [0, 0, ''],
  ])('compares %s current revenue with %s previous revenue', async (current, previous, trend) => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      row(new Date(2026, 8, 1), previous),
      row(new Date(2026, 9, 1), current),
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.revenue).toEqual({ current, trend });
    // October 1 is outside the last 30 days on October 31, but counts toward monthly revenue.
    expect(result.chart).toEqual([]);
    expect(repository.findDailyStatsByDateRange).toHaveBeenCalledWith('tenant-1', new Date(2026, 8, 1), new Date(2026, 9, 31, 23, 59, 59, 999));
  });

  it('keeps current-day data in the chart without including previous-month revenue in the current total', async () => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      row(new Date(2026, 8, 30), 200),
      row(new Date(2026, 9, 31), 300),
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.revenue).toEqual({ current: 300, trend: '+50.00%' });
    expect(result.chart).toHaveLength(1);
    expect(result.chart[0].revenue).toBe(300);
  });

  it('compares appointments against yesterday and new customers against the previous month', async () => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      { ...row(new Date(2026, 8, 1), 0), newCustomers: 10, appointments: 100 },
      { ...row(new Date(2026, 9, 30), 0), newCustomers: 4, appointments: 8 },
      { ...row(new Date(2026, 9, 31), 0), newCustomers: 1, appointments: 12 },
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.appointmentsToday).toEqual({ current: 12, trend: '4 más que ayer' });
    expect(result.stats.newCustomers).toEqual({ current: 5, trend: '-50.00%' });
  });

  it('hides comparisons when previous data is absent', async () => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      { ...row(new Date(2026, 9, 31), 100), newCustomers: 3, appointments: 5 },
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.revenue.trend).toBe('');
    expect(result.stats.appointmentsToday).toEqual({ current: 5, trend: '' });
    expect(result.stats.newCustomers).toEqual({ current: 3, trend: '' });
  });

  it('sums daily customer counters across both months, including the first day of a 31-day month', async () => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      { ...row(new Date(2026, 8, 1), 0), newCustomers: 10 },
      { ...row(new Date(2026, 9, 1), 0), newCustomers: 12 },
      { ...row(new Date(2026, 9, 31), 0), newCustomers: 13 },
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.newCustomers).toEqual({ current: 25, trend: '+150.00%' });
  });

  it.each([
    [28, 4, '24 más que ayer'],
    [4, 28, '24 menos que ayer'],
    [4, 4, 'Igual que ayer'],
    [4, 0, '4 más que ayer'],
  ])('describes the appointment difference for %s today and %s yesterday', async (current, previous, trend) => {
    repository.findDailyStatsByDateRange.mockResolvedValue([
      { ...row(new Date(2026, 9, 30), 0), appointments: previous },
      { ...row(new Date(2026, 9, 31), 0), appointments: current },
    ]);
    const result = await service.getOverview('tenant-1');
    expect(result.stats.appointmentsToday).toEqual({ current, trend });
  });
});
