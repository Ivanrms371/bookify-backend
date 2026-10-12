import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { BillingNoticePlanner } from '../schedulers/billing-notice-planner.service';
import { billingNoticeWindow } from '../utils/billing-notice-time';
import { BillingNoticeRepository } from '../repositories/billing-notice.repository';

jest.mock('../../notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));
const now = new Date('2026-10-10T12:00Z'); // 09:00 business local
const trialEnd = new Date('2026-10-17T18:30Z');
const base = {
  id: 'subscription',
  tenantId: 'tenant',
  status: 'TRIAL',
  planId: 'pro_plus',
  trialEndsAt: trialEnd,
  tenant: { name: 'Salón', slug: 'salon', settings: { timeZone: 'America/Montevideo' }, memberships: [{ userId: 'owner' }] },
};
const paid = {
  ...base,
  status: 'ACTIVE',
  nextRenewalAt: new Date('2026-10-13T18:30Z'),
  lemonSubscriptionId: '42',
  lemonCustomerId: '15',
  billingCycle: 'MONTHLY',
};
function setup(state = base) {
  const repository = {
    findCandidates: jest.fn().mockResolvedValue([]),
  };
  const subscriptions = { findState: jest.fn().mockResolvedValue(state), ensureRenewalChecked: jest.fn().mockResolvedValue(true) };
  const notifications = { createOccurrence: jest.fn() };
  const planner = new BillingNoticePlanner(
    repository as never,
    subscriptions as never,
    notifications as never,
    new ConfigService({ APP_URL: 'https://app.example.com' }),
  );
  return { planner, repository, subscriptions, notifications };
}
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('creates the 7-day occurrence for the owner with an exact deadline and a safe plans link', async () => {
  const { planner, notifications } = setup();
  await planner.plan('tenant', now);
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
  expect(notifications.createOccurrence).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'billing.trial.ends.7d',
      recipientId: 'owner',
      recipientType: 'USER',
      tenantId: 'tenant',
      referenceId: 'subscription',
      occurrenceKey: `billing.trial.ends.7d:tenant:subscription:${trialEnd.toISOString()}:owner`,
      expiresAt: new Date('2026-10-11T00:00Z'),
      payload: expect.objectContaining({
        eventAt: trialEnd.toISOString(),
        endTime: '15:30',
        actionUrl: 'https://app.example.com/salon/billing/plans',
      }),
    }),
  );
});
it('creates the 3-day trial milestone without replaying the previous milestone', async () => {
  const { planner, notifications } = setup();
  await planner.plan('tenant', new Date('2026-10-14T12:00Z'));
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
  expect(notifications.createOccurrence.mock.calls[0][0].type).toBe('billing.trial.ends.3d');
});
it.each(['2026-10-10T11:59:59Z', '2026-10-11T00:00Z', '2026-10-11T12:00Z'])(
  'skips before opening or after the same-date window: %s',
  async (time) => {
    const { planner, notifications } = setup();
    await planner.plan('tenant', new Date(time));
    expect(notifications.createOccurrence).not.toHaveBeenCalled();
  },
);
it('catches up the same afternoon, retains stable keys across repeated runs and sends to every active owner', async () => {
  const state = { ...base, tenant: { ...base.tenant, memberships: [{ userId: 'owner' }, { userId: 'second-owner' }] } };
  const { planner, notifications } = setup(state);
  await planner.plan('tenant', new Date('2026-10-10T20:00Z'));
  await planner.plan('tenant', new Date('2026-10-10T20:05Z'));
  const values = notifications.createOccurrence.mock.calls.map(([value]) => value);
  expect(values).toHaveLength(4);
  expect(values[0].occurrenceKey).toBe(values[2].occurrenceKey);
  expect(values[1].recipientId).toBe('second-owner');
});
it.each([
  { ...base, status: 'ACTIVE', planId: 'free' },
  { ...base, status: 'EXPIRED' },
  { ...base, tenant: { ...base.tenant, memberships: [] } },
])('does not notify retained trial history or missing owners', async (state) => {
  const { planner, notifications } = setup(state);
  await planner.plan('tenant', now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('checks the provider before trusting a legacy period-end hint', async () => {
  const { planner, subscriptions, notifications } = setup({ ...paid, nextRenewalAt: null, currentPeriodEnd: paid.nextRenewalAt } as never);
  subscriptions.findState
    .mockResolvedValueOnce({ ...paid, nextRenewalAt: null, currentPeriodEnd: paid.nextRenewalAt } as never)
    .mockResolvedValue(paid as never);
  await planner.plan('tenant', now);
  expect(subscriptions.ensureRenewalChecked).toHaveBeenCalledTimes(1);
  expect(notifications.createOccurrence).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'billing.renewal.3d',
      payload: expect.objectContaining({ actionUrl: 'https://app.example.com/salon/billing' }),
    }),
  );
});
it.each(['MONTHLY', 'ANNUAL'])('sends an eligible %s renewal without an amount or plan promise', async (billingCycle) => {
  const { planner, notifications } = setup({ ...paid, billingCycle } as never);
  await planner.plan('tenant', now);
  const payload = notifications.createOccurrence.mock.calls[0][0].payload;
  expect(payload).not.toHaveProperty('amount');
  expect(payload).not.toHaveProperty('planName');
});
it.each([
  { status: 'CANCELLED' },
  { status: 'PAST_DUE' },
  { status: 'PAUSED' },
  { pendingPlanId: 'free' },
  { pendingPlanId: 'pro' },
  { planChangeUndoRequestedAt: now },
  { endsAt: trialEnd },
])('suppresses ineligible or pending renewals: %s', async (patch) => {
  const { planner, subscriptions, notifications } = setup({ ...paid, ...patch } as never);
  await planner.plan('tenant', now);
  expect(subscriptions.ensureRenewalChecked).not.toHaveBeenCalled();
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('does not create a notice when another worker owns verification or verification changes the date', async () => {
  const f = setup(paid as never);
  f.subscriptions.ensureRenewalChecked.mockResolvedValue(false);
  await f.planner.plan('tenant', now);
  expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
  f.subscriptions.ensureRenewalChecked.mockResolvedValue(true);
  f.subscriptions.findState.mockResolvedValueOnce(paid as never).mockResolvedValue({ ...paid, nextRenewalAt: trialEnd } as never);
  await f.planner.plan('tenant', now);
  expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
});
it('uses calendar days across DST and year boundaries', () => {
  const dst = billingNoticeWindow(new Date('2026-03-10T13:00Z'), 3, 'America/New_York');
  expect(dst.dueDate).toBe('2026-03-07');
  expect(dst.dueAt).toEqual(new Date('2026-03-07T14:00Z'));
  expect(billingNoticeWindow(new Date('2027-01-03T01:00Z'), 3, 'America/Montevideo').dueDate).toBe('2026-12-30');
});
it('uses the default timezone but rejects an invalid configured zone', async () => {
  const f = setup({ ...base, tenant: { ...base.tenant, settings: null } } as never);
  await f.planner.plan('tenant', now);
  expect(f.notifications.createOccurrence).toHaveBeenCalled();
  f.subscriptions.findState.mockResolvedValue({ ...base, tenant: { ...base.tenant, settings: { timeZone: 'wrong/zone' } } });
  await expect(f.planner.plan('tenant', now)).rejects.toThrow();
});
it('continues planning other businesses after provider failure', async () => {
  jest.useFakeTimers().setSystemTime(now);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  const f = setup(paid as never);
  f.repository.findCandidates.mockResolvedValueOnce([
    { id: 'a', tenantId: 'a' },
    { id: 'b', tenantId: 'b' },
  ]);
  f.subscriptions.ensureRenewalChecked.mockRejectedValueOnce(new Error('provider down'));
  await f.planner.handle();
  expect(f.notifications.createOccurrence).toHaveBeenCalledTimes(1);
});
it('scopes candidate queries to active tenants', async () => {
  const prisma = { subscription: { findMany: jest.fn() }, notificationDelivery: { updateMany: jest.fn() } };
  const repo = new BillingNoticeRepository(prisma as never);
  await repo.findCandidates('cursor');
  expect(prisma.subscription.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ deletedAt: null, tenant: { deletedAt: null, isActive: true } }),
      cursor: { id: 'cursor' },
      take: 100,
    }),
  );
});
