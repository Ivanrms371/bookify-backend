import { Logger } from '@nestjs/common';
import { BillingNoticeStateService } from '../billing-notice-state.service';
import { renewalProjection, canNotifyRenewal, invalidateRenewalForPendingChange } from '../utils/renewal-projection';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import { SubscriptionsRepository } from '../subscriptions.repository';

const now = new Date('2026-10-10T12:00Z');
const renewal = new Date('2026-10-13T18:00Z');
const state = {
  id: 'sub',
  tenantId: 'tenant',
  lemonSubscriptionId: '42',
  lemonCustomerId: '15',
  planId: 'pro',
  status: 'ACTIVE',
  updatedAt: new Date('2026-10-09T12:00Z'),
  nextRenewalAt: renewal,
  renewalCheckedAt: null,
  billingCycle: 'MONTHLY',
};
const current = {
  id: '42',
  type: 'subscriptions',
  attributes: {
    customer_id: 15,
    variant_id: 123,
    status: 'active',
    renews_at: renewal.toISOString(),
    cancelled: false,
    pause: null,
    ends_at: null,
    trial_ends_at: null,
    updated_at: '2026-10-10T11:00:00Z',
  },
} as LemonSqueezySubscriptionData;
function setup(value = state) {
  const tx = { transaction: true };
  const prisma = {
    subscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), findFirst: jest.fn() },
    $transaction: jest.fn((work) => work(tx)),
  };
  const provider = { retrieveSubscription: jest.fn().mockResolvedValue(current), retrieveLatestInvoice: jest.fn().mockResolvedValue(null) };
  const sync = {
    acquireLock: jest.fn(),
    isNewer: jest.fn().mockResolvedValue(true),
    matchesVersion: jest.fn().mockResolvedValue(false),
    markVersion: jest.fn(),
  };
  const repository = { findByTenantId: jest.fn().mockResolvedValue(value), updateByTenantId: jest.fn() };
  const plans = { resolvePlanByVariantId: jest.fn().mockReturnValue({ planId: 'pro', cycle: 'MONTHLY', price: 14.99 }) };
  const service = new BillingNoticeStateService(prisma as never, provider as never, sync as never, repository as never, plans as never);
  return { service, provider, prisma, sync, repository, tx };
}
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(now);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('verifies provider association outside the transaction and saves the authoritative renewal', async () => {
  const f = setup();
  f.provider.retrieveSubscription.mockImplementation(async () => {
    expect(f.prisma.$transaction).not.toHaveBeenCalled();
    return current;
  });
  expect(await f.service.ensureRenewalChecked(state as never, now, 'America/Montevideo')).toBe(true);
  expect(f.repository.updateByTenantId).toHaveBeenCalledWith(
    'tenant',
    expect.objectContaining({ nextRenewalAt: renewal, renewalCheckedAt: now }),
    f.tx,
  );
  expect(f.sync.markVersion).toHaveBeenCalledWith('subscriptions:42', current.attributes.updated_at, f.tx);
});
it('reuses same-local-day verification under 24h but refreshes yesterday even when recent', async () => {
  const f = setup();
  expect(
    await f.service.ensureRenewalChecked({ ...state, renewalCheckedAt: new Date('2026-10-10T11:00Z') } as never, now, 'America/Montevideo'),
  ).toBe(true);
  expect(f.provider.retrieveSubscription).not.toHaveBeenCalled();
  await f.service.ensureRenewalChecked({ ...state, renewalCheckedAt: new Date('2026-10-10T02:00Z') } as never, now, 'America/Montevideo');
  expect(f.provider.retrieveSubscription).toHaveBeenCalledTimes(1);
});
it('reserves only one concurrent refresh and throttles retries for five minutes', async () => {
  const f = setup();
  f.prisma.subscription.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
  const results = await Promise.all([
    f.service.ensureRenewalChecked(state as never, now, 'UTC'),
    f.service.ensureRenewalChecked(state as never, now, 'UTC'),
  ]);
  expect(results.sort()).toEqual([false, true]);
  expect(f.provider.retrieveSubscription).toHaveBeenCalledTimes(1);
  expect(f.prisma.subscription.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: 'sub',
        tenantId: 'tenant',
        lemonSubscriptionId: '42',
        deletedAt: null,
        OR: [{ renewalCheckAttemptedAt: null }, { renewalCheckAttemptedAt: { lte: new Date(now.getTime() - 300_000) } }],
      }),
    }),
  );
});
it('does not synchronize a mismatched provider customer', async () => {
  const f = setup();
  f.provider.retrieveSubscription.mockResolvedValue({ ...current, attributes: { ...current.attributes, customer_id: 999 } });
  await expect(f.service.ensureRenewalChecked(state as never, now, 'UTC')).rejects.toThrow('association mismatch');
  expect(f.prisma.$transaction).not.toHaveBeenCalled();
});
it('rejects an old response but permits a successfully retrieved equal version', async () => {
  const f = setup();
  f.sync.isNewer.mockResolvedValue(false);
  expect(await f.service.ensureRenewalChecked(state as never, now, 'UTC')).toBe(false);
  expect(f.repository.updateByTenantId).not.toHaveBeenCalled();
  f.sync.matchesVersion.mockResolvedValue(true);
  expect(await f.service.ensureRenewalChecked(state as never, now, 'UTC')).toBe(true);
  expect(f.sync.markVersion).not.toHaveBeenCalled();
});
it('does not apply a response over a concurrent cancellation intent or replacement subscription', async () => {
  const f = setup();
  f.repository.findByTenantId.mockResolvedValue({ ...state, updatedAt: new Date(now.getTime() + 1), pendingPlanId: 'free' } as never);
  expect(await f.service.ensureRenewalChecked(state as never, now, 'UTC')).toBe(false);
  f.repository.findByTenantId.mockResolvedValue({ ...state, lemonSubscriptionId: '99' });
  expect(await f.service.ensureRenewalChecked(state as never, now, 'UTC')).toBe(false);
  expect(f.repository.updateByTenantId).not.toHaveBeenCalled();
});
it('logs failed provider reads and does not mark them fresh', async () => {
  const f = setup();
  f.provider.retrieveSubscription.mockRejectedValue(new Error('timeout'));
  await expect(f.service.ensureRenewalChecked(state as never, now, 'UTC')).rejects.toThrow('timeout');
  expect(f.repository.updateByTenantId).not.toHaveBeenCalled();
  expect(Logger.prototype.warn).toHaveBeenCalled();
});
it('limits provider reads across subscriptions to two concurrent calls', async () => {
  const f = setup();
  let active = 0;
  let maximum = 0;
  const finish: Array<() => void> = [];
  f.provider.retrieveSubscription.mockImplementation(
    () =>
      new Promise((resolve) => {
        active++;
        maximum = Math.max(maximum, active);
        finish.push(() => {
          active--;
          resolve(current);
        });
      }),
  );
  const tasks = [0, 1, 2, 3].map(() => f.service.ensureRenewalChecked(state as never, now, 'UTC'));
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(finish).toHaveLength(2);
  finish.splice(0).forEach((done) => done());
  for (let i = 0; i < 20; i++) await Promise.resolve();
  finish.splice(0).forEach((done) => done());
  await Promise.all(tasks);
  expect(maximum).toBe(2);
});
it.each([
  { status: 'cancelled', cancelled: true },
  { status: 'expired' },
  { status: 'past_due' },
  { status: 'paused' },
  { pause: { mode: 'free' } },
  { ends_at: renewal.toISOString() },
  { renews_at: 'invalid' },
])('does not project a charge date for %s', (patch) => {
  expect(
    renewalProjection({ ...current, attributes: { ...current.attributes, ...patch } } as LemonSqueezySubscriptionData).nextRenewalAt,
  ).toBeNull();
});
it('suppresses all pending changes and clears their renewal freshness on repository writes', async () => {
  expect(canNotifyRenewal(state as never, now)).toBe(true);
  expect(canNotifyRenewal({ ...state, pendingPlanId: 'pro_plus' } as never, now)).toBe(false);
  expect(invalidateRenewalForPendingChange({ pendingPlanId: 'free' })).toEqual({
    pendingPlanId: 'free',
    nextRenewalAt: null,
    renewalCheckedAt: null,
  });
  const tx = { subscription: { update: jest.fn().mockResolvedValue(state) }, $executeRaw: jest.fn() };
  const usage = { ensureCurrentUsage: jest.fn() };
  const repo = new SubscriptionsRepository({} as never, usage as never);
  await repo.updateByTenantId('tenant', { planChangeUndoRequestedAt: now }, tx as never);
  expect(tx.subscription.update).toHaveBeenCalledWith({
    where: { tenantId: 'tenant' },
    data: { planChangeUndoRequestedAt: now, nextRenewalAt: null, renewalCheckedAt: null },
  });
});
it('only reads active businesses and active owner memberships', async () => {
  const f = setup();
  await f.service.findState('tenant');
  expect(f.prisma.subscription.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { tenantId: 'tenant', deletedAt: null, tenant: { deletedAt: null, isActive: true } },
      include: {
        tenant: {
          include: {
            settings: { select: { timeZone: true } },
            memberships: { where: { role: 'OWNER', isActive: true }, select: { userId: true } },
          },
        },
      },
    }),
  );
});
