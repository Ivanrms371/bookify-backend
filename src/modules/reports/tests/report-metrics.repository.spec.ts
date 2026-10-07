import { ReportMetricsRepository } from '../repositories/report-metrics.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { reportOverviewQuery } from '../repositories/report-overview.query';
import { resolveReportScope } from '../utils/report-period';

describe('Reports repository resource scope', () => {
  const prisma = {
    professional: { findFirst: jest.fn(), findMany: jest.fn() },
    service: { findFirst: jest.fn(), findMany: jest.fn() },
  };
  const repository = new ReportMetricsRepository(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('checks both selected resources in the resolved tenant', async () => {
    prisma.professional.findFirst.mockResolvedValue({ id: 'professional' });
    prisma.service.findFirst.mockResolvedValue(null);
    const scope = resolveReportScope('tenant', { professionalId: 'professional', serviceId: 'foreign' }, 'UTC', 'USD', new Date('2026-10-06'));
    expect(await repository.filtersBelongToTenant(scope)).toBe(false);
    expect(prisma.professional.findFirst).toHaveBeenCalledWith({ where: { id: 'professional', tenantId: 'tenant' }, select: { id: true } });
    expect(prisma.service.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign', tenantId: 'tenant' }, select: { id: true } });
  });

  it('allows unfiltered reports without directory lookups', async () => {
    const scope = resolveReportScope('tenant', {}, 'UTC', 'USD', new Date('2026-10-06'));
    expect(await repository.filtersBelongToTenant(scope)).toBe(true);
    expect(prisma.service.findFirst).not.toHaveBeenCalled();
    expect(prisma.professional.findFirst).not.toHaveBeenCalled();
  });

  it('bounds both comparison ranges instead of including the rest of the previous month', () => {
    const scope = resolveReportScope('tenant', {}, 'America/Montevideo', 'UYU', new Date('2026-10-06T12:00:00Z'));
    const query = reportOverviewQuery(scope);
    expect(query.values).toContain('2026-09-07T03:00:00.000Z');
    expect(query.sql).toMatch(/AND \(\(a\.starts_at >= .*? AND a\.starts_at < .*?\)\s+OR \(a\.starts_at >= .*? AND a\.starts_at < .*?\)\)/);
  });

  it('loads active and historically used options without report filters or private fields', async () => {
    prisma.service.findMany.mockResolvedValue([]);
    prisma.professional.findMany.mockResolvedValue([]);
    expect(await repository.findFilterOptions('tenant')).toEqual({ services: [], professionals: [] });
    const request = {
      where: { tenantId: 'tenant', OR: [{ isActive: true, deletedAt: null }, { appointments: { some: { tenantId: 'tenant' } } }] },
      select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }],
    };
    expect(prisma.service.findMany).toHaveBeenCalledWith(request);
    expect(prisma.professional.findMany).toHaveBeenCalledWith(request);
  });
});
