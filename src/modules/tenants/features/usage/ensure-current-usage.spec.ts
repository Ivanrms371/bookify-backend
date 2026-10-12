import type { Subscription, TenantUsage } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { TenantUsageService } from './tenant-usage.service';
import { TenantQuotaMapper } from './mappers/tenant-usage.mapper';
import { SubscriptionsRepository } from 'src/modules/subscriptions/subscriptions.repository';
import { TenantUsageRepository } from './tenant-usage.repository';

const now = new Date('2026-12-15T12:00:00Z');
const record = (data: Partial<Subscription> = {}) =>
  ({
    tenantId: 'tenant',
    planId: 'pro_plus',
    status: 'ACTIVE',
    deletedAt: null,
    trialEndsAt: new Date('2027-01-01T00:00:00Z'),
    ...data,
  }) as Subscription;

function setup(subscription: Subscription | null = record()) {
  const rows = new Map<string, TenantUsage>();
  const key = (p) => `${p.periodYear}-${p.periodMonth}`;
  const tx = {
    $executeRaw: jest.fn(),
    subscription: {
      findUnique: jest.fn(async () => subscription),
      update: jest.fn(async ({ data }) => (subscription = { ...subscription!, ...data })),
      upsert: jest.fn(async ({ create }) => (subscription ??= record(create))),
      updateMany: jest.fn(async ({ data }) => {
        subscription = { ...subscription!, ...data };
        return { count: 1 };
      }),
    },
    tenantUsage: {
      findUnique: jest.fn(async ({ where }) => rows.get(key(where.tenantId_periodMonth_periodYear)) ?? null),
      create: jest.fn(async ({ data }) => {
        const row = { id: key(data), emailCount: 0, whatsappCount: 0, appointmentCount: 0, appointmentLimit: 0, ...data } as TenantUsage;
        if (rows.has(row.id)) throw new Error('duplicate period');
        rows.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where, data }) => {
        const row = rows.get(key(where.tenantId_periodMonth_periodYear))!;
        Object.assign(row, data);
        return row;
      }),
    },
  };
  const prisma = { $transaction: jest.fn(async (work) => work(tx)) };
  return {
    tx,
    rows,
    prisma,
    db: tx as unknown as TransactionClient,
    service: new TenantUsageService(new TenantUsageRepository(prisma as never), prisma as never),
    setSubscription: (value: Subscription | null) => (subscription = value),
  };
}

afterEach(() => jest.useRealTimers());

it.each([
  [record(), 1200, 500],
  [record({ planId: 'pro' }), 400, 200],
  [record({ status: 'TRIAL' }), 1200, 500],
  [record({ planId: 'free' }), 0, 0],
  [record({ status: 'EXPIRED' }), 0, 0],
  [record({ status: 'SUSPENDED' }), 0, 0],
  [record({ status: 'PAUSED' }), 0, 0],
  [record({ status: 'PAST_DUE' }), 0, 0],
  [record({ status: 'TRIAL', trialEndsAt: now }), 0, 0],
  [record({ status: 'CANCELLED', endsAt: new Date(now.getTime() + 1) }), 1200, 500],
  [record({ status: 'CANCELLED', endsAt: now }), 0, 0],
  [record({ deletedAt: now }), 0, 0],
  [record({ planId: 'unknown' }), 0, 0],
  [record({ planId: 'constructor' }), 0, 0],
  [null, 0, 0],
])('creates the effective subscription allowance for %j', async (subscription, emailLimit, whatsappLimit) => {
  const { db, service } = setup(subscription);
  expect(await service.ensureCurrentUsage('tenant', db, now)).toMatchObject({ emailLimit, whatsappLimit, emailCount: 0, whatsappCount: 0 });
});

it.each([-1, 0, 1])('applies a confirmed downgrade at its deadline (offset %i ms), retaining consumption', async (offset) => {
  const state = setup();
  const row = await state.service.ensureCurrentUsage('tenant', state.db, now);
  Object.assign(row, { emailCount: 900, whatsappCount: 300, appointmentCount: 70, appointmentLimit: -1, totalCost: '42.5' });
  const preserved = { ...row };
  state.setSubscription(record({ pendingPlanId: 'pro', pendingBillingCycle: 'MONTHLY', planChangesAt: now }));
  const result = await state.service.ensureCurrentUsage('tenant', state.db, new Date(now.getTime() + offset));
  expect(result).toEqual({ ...preserved, emailLimit: offset < 0 ? 1200 : 400, whatsappLimit: offset < 0 ? 500 : 200 });
  expect(TenantQuotaMapper.toDomain(result).emails.percentage).toBe(offset < 0 ? 75 : 225);
});

it('never grants a pending upgrade or prematurely applies an unconfirmed downgrade', async () => {
  const state = setup(record({ planId: 'pro', pendingPlanId: 'pro_plus', planChangesAt: new Date('2020-01-01') }));
  expect((await state.service.ensureCurrentUsage('tenant', state.db, now)).emailLimit).toBe(400);
  state.setSubscription(record({ pendingPlanId: 'pro', planChangesAt: null }));
  expect((await state.service.ensureCurrentUsage('tenant', state.db, now)).emailLimit).toBe(1200);
});

it('creates a fresh UTC year/month and preserves the complete historical row', async () => {
  const state = setup(record({ status: 'TRIAL' }));
  const previous = await state.service.ensureCurrentUsage('tenant', state.db, new Date('2026-12-31T23:59:59.999Z'));
  previous.emailCount = 1100;
  const snapshot = { ...previous };
  const current = await state.service.ensureCurrentUsage('tenant', state.db, new Date('2027-01-01T00:00:00Z'));
  expect(current).toMatchObject({ periodYear: 2027, periodMonth: 1, emailCount: 0, emailLimit: 0 });
  expect(state.rows.get('2026-12')).toEqual(snapshot);
});

it('synchronizes persisted subscription writes, recovery, Free and cycle/renewal changes without resetting counts', async () => {
  jest.useFakeTimers().setSystemTime(now);
  const state = setup(record({ planId: 'pro' }));
  const repo = new SubscriptionsRepository(state.prisma as never, state.service);
  const row = await state.service.ensureCurrentUsage('tenant', state.db, now);
  row.emailCount = 350;
  for (const [data, expected] of [
    [{ planId: 'pro_plus' }, 1200],
    [{ status: 'PAST_DUE' }, 0],
    [{ status: 'ACTIVE' }, 1200],
    [{ billingCycle: 'ANNUAL', currentPeriodEnd: new Date('2028-01-01') }, 1200],
    [{ planId: 'free' }, 0],
  ] as const) {
    await repo.updateByTenantId('tenant', data, state.db);
    expect(row).toMatchObject({ emailCount: 350, emailLimit: expected });
  }
  expect(state.tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(state.tx.subscription.update.mock.invocationCallOrder[0]);
});

it('provisions a new trial and preserves it on repeated onboarding', async () => {
  jest.useFakeTimers().setSystemTime(now);
  const state = setup(null);
  const repo = new SubscriptionsRepository(state.prisma as never, state.service);
  const trial = {
    planId: 'pro_plus',
    status: 'TRIAL',
    trialEndsAt: new Date('2027-01-01'),
    tenant: { connect: { id: 'tenant' } },
  } as const;
  await repo.ensureTrial('tenant', trial, state.db);
  state.rows.get('2026-12')!.emailCount = 14;
  await repo.ensureTrial('tenant', trial, state.db);
  expect(state.rows.get('2026-12')).toMatchObject({ emailLimit: 1200, whatsappLimit: 500, emailCount: 14 });
  expect(state.tx.tenantUsage.create).toHaveBeenCalledTimes(1);
});

it('uses post-activation persisted state, even when updateMany returns only a count', async () => {
  jest.useFakeTimers().setSystemTime(now);
  const state = setup(record({ planId: 'free' }));
  const repo = new SubscriptionsRepository(state.prisma as never, state.service);
  await repo.attachProviderSubscription('tenant', null, { planId: 'pro', status: 'ACTIVE' }, state.db);
  expect(state.rows.get('2026-12')).toMatchObject({ emailLimit: 400, whatsappLimit: 200 });
});

it('captures the current period after waiting for the entitlements lock on reads', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-12-31T23:59:59Z'));
  const state = setup();
  state.tx.$executeRaw.mockImplementation(async () => jest.setSystemTime(new Date('2027-01-01T00:00:00Z')));
  expect(await state.service.getCurrentUsage('tenant')).toMatchObject({ periodMonth: 1, periodYear: 2027 });
});

it('returns finite percentages for zero limits, including nonzero consumption', () => {
  const usage = {
    emailCount: 100,
    emailLimit: 0,
    whatsappCount: 0,
    whatsappLimit: 0,
    appointmentCount: 1,
    appointmentLimit: 0,
  } as TenantUsage;
  expect(Object.values(TenantQuotaMapper.toDomain(usage)).every((item) => item.percentage === 0)).toBe(true);
});

it('does not update an unchanged allowance or its reset timestamp', async () => {
  const state = setup();
  const first = await state.service.ensureCurrentUsage('tenant', state.db, now);
  expect(await state.service.ensureCurrentUsage('tenant', state.db, new Date(now.getTime() + 1000))).toBe(first);
  expect(state.tx.tenantUsage.update).not.toHaveBeenCalled();
  expect(first.lastResetAt).toBe(now);
});

it('updates only the notification limit that changed', async () => {
  const state = setup();
  const row = await state.service.ensureCurrentUsage('tenant', state.db, now);
  row.emailLimit = 100;
  await state.service.ensureCurrentUsage('tenant', state.db, now);
  expect(state.tx.tenantUsage.update).toHaveBeenCalledWith({
    where: { tenantId_periodMonth_periodYear: { tenantId: 'tenant', periodMonth: 12, periodYear: 2026 } },
    data: { emailLimit: 1200 },
  });
});
