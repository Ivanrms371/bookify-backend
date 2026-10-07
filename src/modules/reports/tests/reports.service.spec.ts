import 'reflect-metadata';
import { validationPipe } from 'src/config/configuration';
import { PERMISSIONS_KEY } from 'src/common/security/decorators/permissions.decorator';
import { GetReportsOverviewDto } from '../dto/get-reports-overview.dto';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { ReportMetricsService } from '../services/report-metrics.service';
import { ReportMetricsRepository } from '../repositories/report-metrics.repository';
import type { ReportOverviewData } from '../types/reports.types';

const emptyData: ReportOverviewData = {
  summary: { current: { revenue: 0, completed: 0 }, previous: { revenue: 0, completed: 0 } },
  dailyRevenue: [], topServices: [], professionals: [],
  outcomes: [{ key: 'completed', count: 0 }, { key: 'cancelled', count: 0 }, { key: 'noShow', count: 0 }, { key: 'pendingConfirmed', count: 0 }],
};

describe('report query validation', () => {
  const transform = (query: unknown) => validationPipe.transform(query, { type: 'query', metatype: GetReportsOverviewDto });
  it('accepts seeded/generated IDs and configurable top-service limit', async () => {
    const query = await transform({ professionalId: 'f84da764-86c9-5da3-a995-762e25e69f24', serviceId: '019a1234-5678-7abc-8def-0123456789ab', topServicesLimit: '8' });
    expect(query.period).toBe('this-month');
    expect(query.topServicesLimit).toBe(8);
  });
  it.each([
    { period: 'anything' }, { startDate: '2026-02-30' }, { endDate: '2026-10-01T12:00:00Z' },
    { professionalId: 'all' }, { topServicesLimit: '21' }, { topServicesLimit: '0' }, { tenantId: 'foreign' },
  ])('rejects malformed request %j', async (query) => {
    await expect(transform(query)).rejects.toThrow();
  });
  it('protects both Reports routes with report:read', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, ReportsController)).toEqual(['report:read']);
  });
});

describe('Reports service', () => {
  const repository = {
    findSettings: jest.fn(), filtersBelongToTenant: jest.fn(), findReportAggregates: jest.fn(), findFilterOptions: jest.fn(),
  };
  const metrics = new ReportMetricsService(repository as unknown as ReportMetricsRepository);
  const service = new ReportsService(metrics, repository as unknown as ReportMetricsRepository);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T12:00:00Z'));
    jest.resetAllMocks();
    repository.findSettings.mockResolvedValue({ timeZone: 'America/Montevideo', currency: 'UYU' });
    repository.filtersBelongToTenant.mockResolvedValue(true);
    repository.findReportAggregates.mockResolvedValue(emptyData);
  });
  afterEach(() => jest.useRealTimers());

  it('propagates the same tenant, combined filters, range and limit to every aggregate', async () => {
    const result = await service.getOverview('tenant-1', { professionalId: 'professional', serviceId: 'service', topServicesLimit: 8 });
    expect(repository.findReportAggregates).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', professionalId: 'professional', serviceId: 'service', topServicesLimit: 8 }));
    expect(result.period.endDate).toBe('2026-10-06');
    expect(result.dailyRevenue).toHaveLength(6);
    expect(result.dailyRevenue.every((day) => day.revenue === 0)).toBe(true);
    expect(result.outcomes).toHaveLength(4);
  });

  it('fills zero days around existing daily revenue without changing the totals', async () => {
    repository.findReportAggregates.mockResolvedValue({ ...emptyData, summary: { ...emptyData.summary, current: { revenue: 125, completed: 1 } }, dailyRevenue: [{ date: '2026-10-02', revenue: 125 }] });
    const result = await service.getOverview('tenant-1', { period: 'custom', startDate: '2026-10-01', endDate: '2026-10-03' });
    expect(result.dailyRevenue).toEqual([{ date: '2026-10-01', revenue: 0 }, { date: '2026-10-02', revenue: 125 }, { date: '2026-10-03', revenue: 0 }]);
    expect(result.summary.current.revenue).toBe(125);
  });

  it('rejects another tenant’s filter before querying analytics', async () => {
    repository.filtersBelongToTenant.mockResolvedValue(false);
    await expect(service.getOverview('tenant-1', { serviceId: 'foreign' })).rejects.toThrow('no pertenece');
    expect(repository.findReportAggregates).not.toHaveBeenCalled();
  });

  it('returns stable options separately from overview results with formatting context', async () => {
    repository.findFilterOptions.mockResolvedValue({ services: [{ id: 'service', name: 'Corte' }], professionals: [] });
    expect(await service.getFilterOptions('tenant-1')).toEqual({ services: [{ id: 'service', name: 'Corte' }], professionals: [], timeZone: 'America/Montevideo', currency: 'UYU' });
    expect(repository.findFilterOptions).toHaveBeenCalledWith('tenant-1');
    expect(repository.findReportAggregates).not.toHaveBeenCalled();
  });

  it.each(['overview', 'options'])('rejects missing tenant settings for %s', async (endpoint) => {
    repository.findSettings.mockResolvedValue(null);
    const request = endpoint === 'overview' ? service.getOverview('tenant-1', {}) : service.getFilterOptions('tenant-1');
    await expect(request).rejects.toThrow('configuración');
    expect(repository.findReportAggregates).not.toHaveBeenCalled();
  });

  it('maps filter options without exposing repository-only fields', async () => {
    repository.findFilterOptions.mockResolvedValue({
      services: [{ id: 'service', name: 'Corte', tenantId: 'tenant-1', price: 500 }],
      professionals: [{ id: 'professional', name: 'Ana', email: 'private@example.test' }],
    });
    expect(await service.getFilterOptions('tenant-1')).toEqual({
      services: [{ id: 'service', name: 'Corte' }],
      professionals: [{ id: 'professional', name: 'Ana' }],
      timeZone: 'America/Montevideo', currency: 'UYU',
    });
  });
});
