import { TenantUsageService } from './tenant-usage.service';
import { TenantUsageRepository } from './tenant-usage.repository';
import type { Subscription } from 'src/generated/prisma/client';

function setup(subscription: Partial<Subscription> | null = { planId: 'pro', status: 'ACTIVE' }) {
  const tx = {
    $executeRaw: jest.fn(),
    subscription: { findUnique: jest.fn().mockResolvedValue(subscription) },
    professional: { count: jest.fn().mockResolvedValue(2) },
    service: { count: jest.fn().mockResolvedValue(12) },
    tenantUsage: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(async ({ data }) => ({ emailCount: 0, whatsappCount: 0, appointmentCount: 7, appointmentLimit: -1, ...data })),
    },
  };
  const prisma = { $transaction: jest.fn(async (work) => work(tx)) };
  return { tx, prisma, service: new TenantUsageService(new TenantUsageRepository(prisma as never), prisma as never) };
}

afterEach(() => jest.useRealTimers());

it.each([0, 9, 11])('uses a 1-based UTC month for reads and status in month index %i', async (month) => {
  jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, month, 1, 0, 30)));
  const { service, tx, prisma } = setup();
  const expected = { tenantId: 'tenant', periodMonth: month + 1, periodYear: 2026 };
  expect(await service.getCurrentUsage('tenant')).toMatchObject(expected);
  const status = await service.getUsageStatus('tenant');
  expect(status).toMatchObject({
    professionals: { count: 2, limit: 3, percentage: (2 / 3) * 100 },
    services: { count: 12, limit: 30, percentage: 40 },
    appointments: { count: 7, limit: -1 },
    emails: { count: 0, limit: 400, percentage: 0 },
    catalogLimits: { professionals: 3, services: 30 },
    enforcedLimits: { professionals: null, services: null },
  });
  expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  expect(tx.tenantUsage.findUnique).toHaveBeenCalledWith({ where: { tenantId_periodMonth_periodYear: expected } });
  expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.subscription.findUnique.mock.invocationCallOrder[0]);
  // Counts use the transaction client, including inactive rows and excluding deleted rows.
  expect(tx.professional.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', deletedAt: null } });
  expect(tx.service.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', deletedAt: null } });
});

it('distinguishes paid catalog limits from pending-Free enforced limits', async () => {
  const { service } = setup({ planId: 'pro_plus', status: 'ACTIVE', pendingPlanId: 'free', planChangesAt: new Date('2099-01-01') });
  expect(await service.getUsageStatus('tenant')).toMatchObject({
    catalogLimits: { professionals: 8, services: 60 },
    enforcedLimits: { professionals: 1, services: 10 },
    emails: { limit: 1200 },
  });
});

it.each([null, { planId: 'unknown', status: 'ACTIVE' }, { planId: 'constructor', status: 'ACTIVE' }, { planId: 'pro', status: 'EXPIRED' }])(
  'exposes nullable resource catalog limits and zero notification allowance for %j',
  async (subscription) => {
    const { service } = setup(subscription as Partial<Subscription> | null);
    expect(await service.getUsageStatus('tenant')).toMatchObject({
      professionals: { count: 2, limit: null, percentage: null },
      services: { count: 12, limit: null, percentage: null },
      catalogLimits: { professionals: null, services: null },
      emails: { limit: 0, percentage: 0 },
      whatsapp: { limit: 0, percentage: 0 },
    });
  },
);

it('recounts resources on each status read without monthly resets', async () => {
  const { service, tx } = setup({ planId: 'free', status: 'ACTIVE' });
  tx.professional.count.mockResolvedValue(1);
  tx.service.count.mockResolvedValue(10);
  expect(await service.getUsageStatus('tenant')).toMatchObject({ services: { count: 10, percentage: 100 } });
  jest.useFakeTimers().setSystemTime(new Date('2027-01-01'));
  tx.service.count.mockResolvedValue(9); // Soft deletion frees capacity, irrespective of UTC period.
  expect(await service.getUsageStatus('tenant')).toMatchObject({ professionals: { count: 1 }, services: { count: 9, percentage: 90 } });
});
