import { NotificationFinalizationService } from '../application/services/notification-finalization.service';
import { NotificationConfigService } from '../notification-config.service';
import type { DeliveryResolution } from '../types/notification-reconciliation.type';

const accepted: DeliveryResolution = {
  deliveryId: 'delivery',
  tenantId: 'tenant',
  outcome: 'accepted',
  source: 'cron',
  operator: 'cron',
  evidence: 'Resend GET email provider',
  providerId: 'provider',
};
const rejected: DeliveryResolution = {
  ...accepted,
  outcome: 'not-accepted',
  source: 'manual',
  operator: 'admin',
  providerId: undefined,
  evidence: 'Provider support confirmed request was rejected',
};
function setup() {
  const state: any = {
    delivery: {
      id: 'delivery',
      channel: 'EMAIL',
      status: 'PENDING',
      claimedAt: new Date('2026-10-10T10:00Z'),
      externalReferenceId: 'provider',
      sentAt: null,
    },
    notification: { tenantId: 'tenant', type: 'appointment.created', recipientType: 'USER' },
    reservation: { deliveryId: 'delivery', usageId: 'original-month', channel: 'EMAIL', state: 'RESERVED', ambiguous: true },
    usage: { id: 'original-month', tenantId: 'tenant', emailCount: 3 },
    logs: [],
  };
  const tx: any = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'delivery' }]),
    notificationDelivery: {
      findUnique: jest.fn(async () =>
        structuredClone({ ...state.delivery, notification: state.notification, usageReservation: state.reservation }),
      ),
      update: jest.fn(async ({ data }) => Object.assign(state.delivery, data)),
      updateMany: jest.fn(async ({ where, data }) => {
        const matches =
          state.delivery.id === where.id &&
          state.delivery.status === 'PENDING' &&
          state.delivery.claimedAt &&
          (!state.delivery.externalReferenceId || state.delivery.externalReferenceId === where.OR[1].externalReferenceId);
        if (matches) Object.assign(state.delivery, data);
        return { count: matches ? 1 : 0 };
      }),
    },
    notificationUsageReservation: {
      updateMany: jest.fn(async ({ where, data }) => {
        if (!state.reservation || state.reservation.state !== where.state) return { count: 0 };
        Object.assign(state.reservation, data);
        return { count: 1 };
      }),
    },
    tenantUsage: {
      updateMany: jest.fn(async ({ where }) => {
        if (where.id !== state.usage.id || where.tenantId !== state.usage.tenantId || state.usage.emailCount <= 0) return { count: 0 };
        state.usage.emailCount--;
        return { count: 1 };
      }),
    },
    notificationLog: {
      create: jest.fn(async ({ data }) => {
        state.logs.push(data);
        return data;
      }),
      findFirst: jest.fn(
        async () => state.logs.find((l: any) => l.status === 'FAILED' && l.errorMessage.startsWith('RECONCILIATION: ')) ?? null,
      ),
    },
  };
  let queue = Promise.resolve();
  const prisma: any = {
    ...tx,
    $transaction: jest.fn((work) => {
      const result = queue.then(async () => {
        const before = structuredClone(state);
        try {
          return await work(tx);
        } catch (error) {
          Object.assign(state, before);
          throw error;
        }
      });
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    }),
  };
  return { state, tx, prisma, service: new NotificationFinalizationService(prisma, new NotificationConfigService()) };
}

it('atomically confirms accepted delivery, original quota reservation and audit without incrementing usage', async () => {
  const f = setup();
  expect(await f.service.resolve(accepted)).toEqual({ deliveryId: 'delivery', status: 'SENT', changed: true });
  expect(f.state.reservation).toMatchObject({ state: 'CONFIRMED', ambiguous: false, usageId: 'original-month' });
  expect(f.state.usage.emailCount).toBe(3);
  expect(f.state.delivery).toMatchObject({ status: 'SENT', externalReferenceId: 'provider', errorMessage: null });
  expect(f.state.logs).toHaveLength(1);
  expect(JSON.parse(f.state.logs[0].errorMessage.replace('RECONCILIATION: ', ''))).toMatchObject({
    source: 'cron',
    outcome: 'accepted',
    operator: 'cron',
    evidence: accepted.evidence,
  });
  expect(f.tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(f.tx.$queryRaw.mock.invocationCallOrder[0]);
});

it('releases an ambiguous reservation once, against the original period, on manual proof of non-acceptance', async () => {
  const f = setup();
  f.state.delivery.externalReferenceId = null;
  expect(await f.service.resolve(rejected)).toMatchObject({ status: 'FAILED', changed: true });
  expect(f.state.reservation).toMatchObject({ state: 'RELEASED', ambiguous: false });
  expect(f.state.usage.emailCount).toBe(2);
  expect(f.tx.tenantUsage.updateMany).toHaveBeenCalledWith({
    where: { id: 'original-month', tenantId: 'tenant', emailCount: { gt: 0 } },
    data: { emailCount: { decrement: 1 } },
  });
  expect(await f.service.resolve(rejected)).toMatchObject({ changed: false });
  expect(f.state.usage.emailCount).toBe(2);
  expect(f.state.logs).toHaveLength(1);
});

it('serializes competing worker and cron finalizations without double charging or duplicate audits', async () => {
  const f = setup();
  const results = await Promise.all([f.service.resolve({ ...accepted, source: 'worker' }), f.service.resolve(accepted)]);
  expect(results.filter((r) => r.changed)).toHaveLength(1);
  expect(f.state.logs).toHaveLength(1);
  expect(f.state.usage.emailCount).toBe(3);
});

it.each(['accepted', 'not-accepted'] as const)('rolls back status, quota and audit if the %s audit write fails', async (outcome) => {
  const f = setup();
  if (outcome === 'not-accepted') f.state.delivery.externalReferenceId = null;
  f.tx.notificationLog.create.mockRejectedValue(new Error('audit unavailable'));
  const before = structuredClone(f.state);
  await expect(f.service.resolve(outcome === 'accepted' ? accepted : rejected)).rejects.toThrow('audit unavailable');
  expect(f.state).toEqual(before);
});

it('preserves durable acceptance evidence when finalization fails after recording the provider ID', async () => {
  const f = setup();
  f.state.delivery.externalReferenceId = null;
  await f.service.recordAcceptance('delivery', 'provider', 'tenant');
  expect(f.tx.notificationDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ notification: { tenantId: 'tenant' } }) }));
  f.tx.notificationLog.create.mockRejectedValue(new Error('write failed'));
  await expect(f.service.resolve(accepted)).rejects.toThrow('write failed');
  expect(f.state.delivery).toMatchObject({ status: 'PENDING', externalReferenceId: 'provider', sentAt: expect.anything() });
  expect(Number.isFinite(f.state.delivery.sentAt.getTime())).toBe(true);
  expect(f.state.reservation.state).toBe('RESERVED');
});

it.each([
  { tenantId: 'other' },
  { providerId: 'other' },
  { operator: '' },
  { evidence: '' },
  { providerId: undefined },
  { outcome: 'not-accepted', source: 'cron' },
])('rejects invalid scope or evidence without changing state: %s', async (patch) => {
  const f = setup();
  const before = structuredClone(f.state);
  await expect(f.service.resolve({ ...accepted, ...patch } as DeliveryResolution)).rejects.toThrow();
  expect(f.state).toEqual(before);
});

it('refuses rejection of known acceptance, reversal of confirmed quota, and acceptance of released quota', async () => {
  const f = setup();
  await expect(f.service.resolve(rejected)).rejects.toThrow('contradicts');
  f.state.delivery.externalReferenceId = null;
  f.state.reservation.state = 'CONFIRMED';
  await expect(f.service.resolve(rejected)).rejects.toThrow('cannot be reversed');
  f.state.reservation.state = 'RELEASED';
  f.state.delivery.externalReferenceId = 'provider';
  await expect(f.service.resolve(accepted)).rejects.toThrow('already released');
});

it('refuses released-to-accepted and accepted-to-rejected contradictory repeat resolutions', async () => {
  const f = setup();
  f.state.delivery.externalReferenceId = null;
  await f.service.resolve(rejected);
  await expect(f.service.resolve({ ...accepted, source: 'manual' })).rejects.toThrow('not awaiting');
  const g = setup();
  await g.service.resolve(accepted);
  await expect(g.service.resolve(rejected)).rejects.toThrow('contradicts');
});

it('repairs legacy SENT with a reserved quota and supports non-billable and tenantless worker finalization', async () => {
  const f = setup();
  f.state.delivery.status = 'SENT';
  await f.service.resolve(accepted);
  expect(f.state.reservation.state).toBe('CONFIRMED');
  const g = setup();
  g.state.reservation = null;
  g.state.notification = { tenantId: null, type: 'verification.email.created', recipientType: 'USER' };
  await expect(g.service.resolve({ ...accepted, tenantId: null, source: 'worker' })).resolves.toMatchObject({ status: 'SENT' });
  expect(g.tx.tenantUsage.updateMany).not.toHaveBeenCalled();
});

it('does not manufacture quota for billable deliveries or underflow the original quota period', async () => {
  const f = setup();
  f.state.reservation = null;
  await expect(f.service.resolve(accepted)).rejects.toThrow('no quota reservation');
  const g = setup();
  g.state.delivery.externalReferenceId = null;
  g.state.usage.emailCount = 0;
  const before = structuredClone(g.state);
  await expect(g.service.resolve(rejected)).rejects.toThrow('cannot be decremented');
  expect(g.state).toEqual(before);
});

it('does not reconcile an unclaimed delivery, normal terminal failure or unsupported channel', async () => {
  const f = setup();
  f.state.delivery.claimedAt = null;
  await expect(f.service.resolve(accepted)).rejects.toThrow('not awaiting');
  f.state.delivery.status = 'FAILED';
  f.state.delivery.externalReferenceId = null;
  await expect(f.service.resolve(rejected)).rejects.toThrow('not awaiting');
  f.state.delivery.channel = 'WHATSAPP';
  await expect(f.service.resolve(rejected)).rejects.toThrow('Only email');
});

it('refuses to overwrite a terminal send with a new acceptance ID', async () => {
  const f = setup();
  f.state.delivery.status = 'SENT';
  await expect(f.service.recordAcceptance('delivery', 'different', 'tenant')).rejects.toThrow('no longer claimed');
});
