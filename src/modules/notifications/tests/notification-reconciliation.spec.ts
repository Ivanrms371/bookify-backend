import { Logger } from '@nestjs/common';
import { NotificationReconciliationService } from '../application/services/notification-reconciliation.service';
import { NotificationReconciliationScheduler } from '../schedulers/notification-reconciliation.scheduler';
import { NotificationReconciliationRepository } from '../infraestructure/repositories/notification-reconciliation.repository';
const now = new Date('2026-10-10T12:00Z');
const candidate = { id: 'delivery', externalReferenceId: 'provider', notification: { tenantId: 'tenant' } };
function setup() {
  const repository = {
    countWithoutProviderId: jest.fn().mockResolvedValue(3),
    candidates: jest.fn().mockResolvedValueOnce([candidate]).mockResolvedValue([]),
  };
  const emails = { getAcceptance: jest.fn().mockResolvedValue({ id: 'provider', acceptedAt: now }) };
  const finalization = { resolve: jest.fn().mockResolvedValue({ changed: true }) };
  return {
    repository,
    emails,
    finalization,
    service: new NotificationReconciliationService(repository as never, emails as never, finalization as never),
  };
}
beforeEach(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
it('resolves only positive provider evidence and reports no-ID cases without releasing or resending', async () => {
  const f = setup();
  expect(await f.service.run(now)).toEqual({ checked: 1, resolved: 1, unresolved: 0, withoutProviderId: 3 });
  expect(f.repository.candidates).toHaveBeenCalledWith(new Date('2026-10-10T11:45Z'), undefined);
  expect(f.finalization.resolve).toHaveBeenCalledWith({
    deliveryId: 'delivery',
    tenantId: 'tenant',
    source: 'cron',
    outcome: 'accepted',
    operator: 'resend-reconciliation-cron',
    evidence: 'Resend GET email provider',
    providerId: 'provider',
    acceptedAt: now,
  });
});
it.each(['not found', 'provider timeout', 'database failure'])('leaves claims and quota untouched on %s', async (reason) => {
  const f = setup();
  if (reason === 'not found') f.emails.getAcceptance.mockResolvedValue(null);
  if (reason === 'provider timeout') f.emails.getAcceptance.mockRejectedValue(new Error('timeout'));
  if (reason === 'database failure') f.finalization.resolve.mockRejectedValue(new Error('db failed'));
  expect(await f.service.run(now)).toMatchObject({ resolved: 0, unresolved: 1 });
  if (reason !== 'database failure') expect(f.finalization.resolve).not.toHaveBeenCalled();
});
it('isolates failures and continues through keyset pages with at most two provider calls in flight', async () => {
  const f = setup();
  const page = Array.from({ length: 50 }, (_, i) => ({ ...candidate, id: `delivery-${i}`, externalReferenceId: `provider-${i}` }));
  f.repository.candidates
    .mockReset()
    .mockResolvedValueOnce(page)
    .mockResolvedValueOnce([{ ...candidate, id: 'last' }]);
  let inFlight = 0;
  let maximum = 0;
  f.emails.getAcceptance.mockImplementation(async (id) => {
    maximum = Math.max(maximum, ++inFlight);
    await Promise.resolve();
    inFlight--;
    if (id === 'provider-0') throw new Error('failed');
    return { id, acceptedAt: now };
  });
  expect(await f.service.run(now)).toMatchObject({ checked: 51, resolved: 50, unresolved: 1 });
  expect(maximum).toBe(2);
  expect(f.repository.candidates.mock.calls[1]).toEqual([new Date('2026-10-10T11:45Z'), 'delivery-49']);
});
it('supports platform emails without a tenant and tolerates another instance already resolving a candidate', async () => {
  const f = setup();
  f.repository.candidates.mockReset().mockResolvedValueOnce([{ ...candidate, notification: { tenantId: null } }]);
  f.finalization.resolve.mockResolvedValue({ changed: false });
  expect(await f.service.run(now)).toMatchObject({ checked: 1, resolved: 0, unresolved: 0 });
  expect(f.finalization.resolve).toHaveBeenCalledWith(expect.objectContaining({ tenantId: null }));
});
it('prevents overlapping local cron runs and recovers after a failed scan', async () => {
  let finish!: () => void;
  const reconciliation = {
    run: jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
  };
  const scheduler = new NotificationReconciliationScheduler(reconciliation as never);
  const first = scheduler.handle();
  await scheduler.handle();
  expect(reconciliation.run).toHaveBeenCalledTimes(1);
  finish();
  await first;
  reconciliation.run.mockRejectedValueOnce(new Error('scan failed'));
  await scheduler.handle();
  reconciliation.run.mockResolvedValueOnce(undefined);
  await scheduler.handle();
  expect(reconciliation.run).toHaveBeenCalledTimes(3);
});
it('queries only stale email claims with acceptance IDs or legacy unconfirmed SENT reservations', async () => {
  const model = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn(), findFirst: jest.fn() };
  const repository = new NotificationReconciliationRepository({ notificationDelivery: model } as never);
  await repository.candidates(now, 'after');
  expect(model.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        channel: 'EMAIL',
        claimedAt: { lte: now },
        OR: [{ status: 'PENDING' }, { status: 'SENT', usageReservation: { state: 'RESERVED' } }],
        externalReferenceId: { not: null },
        id: { gt: 'after' },
      },
      take: 50,
      orderBy: { id: 'asc' },
    }),
  );
  await repository.list('tenant', now, 20, 'after');
  expect(model.findMany).toHaveBeenLastCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ notification: { tenantId: 'tenant' }, id: { gt: 'after' } }), take: 20 }),
  );
  await repository.inspect('tenant', 'delivery');
  expect(model.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'delivery', channel: 'EMAIL', notification: { tenantId: 'tenant' } },
      select: expect.not.objectContaining({ notification: expect.anything() }),
    }),
  );
});
