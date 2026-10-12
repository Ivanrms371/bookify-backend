import { ConfigService } from '@nestjs/config';
import { Prisma } from 'src/generated/prisma/client';
import { ProfessionalSummaryPlanner } from '../schedulers/professional-summary-planner.service';
import { ProfessionalSummaryRepository } from '../repositories/professional-summary.repository';
import { summarizeProfessionalDay } from '../utils/professional-summary-outcomes';

jest.mock('../../notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));
const candidate = {
  id: 'professional',
  tenantId: 'tenant',
  name: 'Ana',
  workingHours: [],
  user: { memberships: [{ tenantId: 'tenant' }] },
  tenant: {
    slug: 'salon',
    settings: { timeZone: 'America/Montevideo', currency: 'USD' },
    tenantWorkingHours: [{ dayOfWeek: 5, opensAt: 540, closesAt: 1080 }],
  },
};
const evening = new Date('2026-10-09T22:00:00Z'); // Friday 19:00 Montevideo
function group(status: string, count = 1, price = '100.10', discount = '10.05', end = '2026-10-09T20:00Z') {
  return {
    status,
    _count: { _all: count },
    _sum: { price: new Prisma.Decimal(price), discountAmount: new Prisma.Decimal(discount) },
    _max: { endsAt: new Date(end) },
  };
}
function setup() {
  const repository = {
    findExceptions: jest.fn().mockResolvedValue([]),
    getDayOutcomes: jest
      .fn()
      .mockResolvedValue([group('COMPLETED', 2), group('CANCELLED'), group('NO_SHOW'), group('CONFIRMED'), group('PENDING')]),
  };
  const notifications = { createOccurrence: jest.fn() };
  const planner = new ProfessionalSummaryPlanner(
    repository as never,
    notifications as never,
    new ConfigService({ FRONTEND_URL: 'https://app.example.com' }),
  );
  return { planner, repository, notifications };
}
it('sends an independent end-of-day occurrence with discounted completed value and all outcome counts', async () => {
  const { planner, notifications, repository } = setup();
  await planner.planEvening(candidate, evening);
  expect(repository.getDayOutcomes).toHaveBeenCalledWith(
    'tenant',
    'professional',
    new Date('2026-10-09T03:00Z'),
    new Date('2026-10-10T03:00Z'),
  );
  expect(notifications.createOccurrence).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'professional.day-end',
      recipientType: 'PROFESSIONAL',
      recipientId: 'professional',
      tenantId: 'tenant',
      occurrenceKey: 'tenant:professional:2026-10-09:day.end',
      expiresAt: new Date('2026-10-10T00:00Z'),
      payload: expect.objectContaining({
        completedCount: 2,
        cancelledCount: 1,
        noShowCount: 1,
        unresolvedCount: 2,
        completedValue: '90.05',
        currency: 'USD',
        businessDate: '2026-10-09',
        professionalId: 'professional',
        snapshotTime: '09 de octubre de 2026 a las 19:00',
        agendaUrl: 'https://app.example.com/salon/calendar?notificationDate=2026-10-09&notificationProfessionalId=professional',
      }),
    }),
  );
});
it('does not send before the last split shift plus one hour', async () => {
  const { planner, notifications, repository } = setup();
  const split = {
    ...candidate,
    workingHours: [
      { dayOfWeek: 5, opensAt: 540, closesAt: 720 },
      { dayOfWeek: 5, opensAt: 840, closesAt: 1080 },
    ],
  };
  await planner.planEvening(split, new Date('2026-10-09T21:59:59Z'));
  expect(repository.getDayOutcomes).not.toHaveBeenCalled();
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.planEvening(split, evening);
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
});
it('defers for a late non-cancelled appointment until one hour after its end', async () => {
  const { planner, notifications, repository } = setup();
  repository.getDayOutcomes.mockResolvedValue([group('CONFIRMED', 1, '100', '0', '2026-10-09T23:00Z')]);
  await planner.planEvening(candidate, evening);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  // 21:00 falls outside the delivery window; next allowed opening is Saturday 08:00.
  await planner.planEvening(candidate, new Date('2026-10-10T00:00Z'), '2026-10-09');
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.planEvening(candidate, new Date('2026-10-10T11:00Z'), '2026-10-09');
  expect(notifications.createOccurrence.mock.calls[0][0].expiresAt).toEqual(new Date('2026-10-10T15:00Z'));
  expect(notifications.createOccurrence.mock.calls[0][0].payload.businessDate).toBe('2026-10-09');
});
it('also waits a full hour after a late appointment that ended just before the scan', async () => {
  const { planner, repository, notifications } = setup();
  repository.getDayOutcomes.mockResolvedValue([group('COMPLETED', 1, '100', '0', '2026-10-09T22:10Z')]);
  await planner.planEvening(candidate, new Date('2026-10-09T22:30Z'));
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.planEvening(candidate, new Date('2026-10-09T23:10Z'));
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
});
it('does not postpone a summary for cancelled appointments with later end times', async () => {
  const { planner, repository, notifications } = setup();
  repository.getDayOutcomes.mockResolvedValue([group('CANCELLED', 2, '200', '0', '2026-10-10T02:00Z')]);
  await planner.planEvening(candidate, evening);
  expect(notifications.createOccurrence.mock.calls[0][0].payload).toEqual(
    expect.objectContaining({ completedCount: 0, cancelledCount: 2, completedValue: '0.00' }),
  );
});
it('skips empty days, closures and custom days off', async () => {
  const { planner, repository, notifications } = setup();
  repository.getDayOutcomes.mockResolvedValue([]);
  await planner.planEvening(candidate, evening);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  repository.findExceptions.mockResolvedValue([
    { startDate: new Date('2026-10-09T03:00Z'), endDate: new Date('2026-10-10T02:59:59Z'), isClosed: true, blocks: [] },
  ] as never);
  await planner.planEvening(candidate, evening);
  repository.findExceptions.mockResolvedValue([]);
  await planner.planEvening({ ...candidate, workingHours: [{ dayOfWeek: 4, opensAt: 540, closesAt: 1080 }] }, evening);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('uses exception closing time rather than the regular business close', async () => {
  const { planner, repository, notifications } = setup();
  repository.findExceptions.mockResolvedValue([
    {
      startDate: new Date('2026-10-09T03:00Z'),
      endDate: new Date('2026-10-10T02:59:59Z'),
      isClosed: false,
      blocks: [{ opensAt: 540, closesAt: 1200 }],
    },
  ] as never);
  await planner.planEvening(candidate, evening);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.planEvening(candidate, new Date('2026-10-10T11:00Z'), '2026-10-09');
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
});
it('allows previous-day outage catch-up only within allowed hours and before next noon', async () => {
  const { planner, notifications } = setup();
  await planner.planEvening(candidate, new Date('2026-10-10T10:59Z'), '2026-10-09');
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.planEvening(candidate, new Date('2026-10-10T11:00Z'), '2026-10-09');
  expect(notifications.createOccurrence.mock.calls[0][0].payload.date).toBe('09 de octubre de 2026');
  notifications.createOccurrence.mockClear();
  await planner.planEvening(candidate, new Date('2026-10-10T15:00Z'), '2026-10-09');
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('keeps one identity across scans and omits dashboard links for unlinked professionals', async () => {
  const { planner, notifications } = setup();
  await planner.planEvening({ ...candidate, user: null }, evening);
  await planner.planEvening({ ...candidate, user: null }, new Date('2026-10-09T22:05Z'));
  expect(notifications.createOccurrence.mock.calls[0][0].occurrenceKey).toBe(notifications.createOccurrence.mock.calls[1][0].occurrenceKey);
  expect(notifications.createOccurrence.mock.calls[0][0].payload.agendaUrl).toBeUndefined();
});
it('uses business-day UTC boundaries on a 23-hour DST day', async () => {
  const { planner, repository } = setup();
  const dstCandidate = {
    ...candidate,
    tenant: {
      ...candidate.tenant,
      settings: { timeZone: 'America/New_York', currency: 'USD' },
      tenantWorkingHours: [{ dayOfWeek: 0, opensAt: 540, closesAt: 1080 }],
    },
  };
  await planner.planEvening(dstCandidate, new Date('2026-03-08T23:00Z'));
  expect(repository.getDayOutcomes).toHaveBeenCalledWith(
    'tenant',
    'professional',
    new Date('2026-03-08T05:00Z'),
    new Date('2026-03-09T04:00Z'),
  );
});
it('uses Decimal arithmetic and ignores non-completed values', () => {
  const summary = summarizeProfessionalDay([group('COMPLETED', 1, '0.30', '0.10'), group('CANCELLED', 1, '999', '0')] as never);
  expect(summary.completedValue).toBe('0.20');
  expect(summary.totalCount).toBe(2);
});
it('groups all tenant-scoped day records without excluding customerless or cancelled appointments', async () => {
  const groupBy = jest.fn();
  const repository = new ProfessionalSummaryRepository({ appointment: { groupBy } } as never);
  await repository.getDayOutcomes('tenant', 'professional', evening, evening);
  expect(groupBy).toHaveBeenCalledWith({
    by: ['status'],
    where: { tenantId: 'tenant', professionalId: 'professional', startsAt: { gte: evening, lt: evening } },
    _count: { _all: true },
    _sum: { price: true, discountAmount: true },
    _max: { endsAt: true },
  });
});
