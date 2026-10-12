import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ProfessionalSummaryPlanner } from '../schedulers/professional-summary-planner.service';
import { morningSummaryDue, localMinuteInstant } from '../utils/professional-summary-time';
import { ProfessionalSummaryRepository } from '../repositories/professional-summary.repository';

jest.mock('../../notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));
const now = new Date('2026-10-09T11:00:00Z'); // Friday, 08:00 Montevideo
const candidate = {
  id: 'professional',
  tenantId: 'tenant',
  name: 'Ana',
  workingHours: [],
  user: { memberships: [{ tenantId: 'tenant' }] },
  tenant: {
    slug: 'salon',
    settings: { timeZone: 'America/Montevideo' },
    tenantWorkingHours: [{ dayOfWeek: 5, opensAt: 540, closesAt: 1080 }],
  },
};
function setup() {
  const repository = {
    findCandidates: jest.fn().mockResolvedValue([]),
    findExceptions: jest.fn().mockResolvedValue([]),
    getAgenda: jest.fn().mockResolvedValue({ _count: { _all: 3 }, _min: { startsAt: new Date('2026-10-09T12:30:00Z') } }),
  };
  const notifications = { createOccurrence: jest.fn() };
  const planner = new ProfessionalSummaryPlanner(
    repository as never,
    notifications as never,
    new ConfigService({ FRONTEND_URL: 'https://app.example.com' }),
  );
  return { repository, notifications, planner };
}

it('uses inherited local hours and creates the professional summary at the workday offset', async () => {
  const { planner, notifications, repository } = setup();
  await planner.plan(candidate, now);
  expect(repository.getAgenda).toHaveBeenCalledWith(
    'tenant',
    'professional',
    new Date('2026-10-09T03:00:00Z'),
    new Date('2026-10-10T03:00:00Z'),
  );
  expect(notifications.createOccurrence).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'professional.day-start',
      recipientId: 'professional',
      recipientType: 'PROFESSIONAL',
      tenantId: 'tenant',
      occurrenceKey: 'tenant:professional:2026-10-09:day.start',
      expiresAt: new Date('2026-10-09T12:30:00Z'),
      payload: expect.objectContaining({
        count: 3,
        firstTime: '09:30',
        workingHours: '09:00–18:00',
        agendaUrl: 'https://app.example.com/salon/calendar',
      }),
    }),
  );
});
it('does not infer shift start from the first appointment or send before due', async () => {
  const { planner, notifications, repository } = setup();
  await planner.plan(candidate, new Date('2026-10-09T10:59:59Z'));
  expect(repository.getAgenda).not.toHaveBeenCalled();
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('uses the earliest custom split shift once and preserves both intervals', async () => {
  const { planner, notifications } = setup();
  await planner.plan(
    {
      ...candidate,
      workingHours: [
        { dayOfWeek: 5, opensAt: 855, closesAt: 1080 },
        { dayOfWeek: 5, opensAt: 555, closesAt: 720 },
      ],
    },
    new Date('2026-10-09T11:15:00Z'),
  );
  expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
  expect(notifications.createOccurrence.mock.calls[0][0].payload.workingHours).toBe('09:15–12:00, 14:15–18:00');
});
it('treats a missing day in a custom weekly schedule as a day off', async () => {
  const { planner, notifications } = setup();
  await planner.plan({ ...candidate, workingHours: [{ dayOfWeek: 4, opensAt: 540, closesAt: 1080 }] }, now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('skips closures and uses replacement exception hours', async () => {
  const { planner, repository, notifications } = setup();
  const exception = { startDate: new Date('2026-10-09T03:00Z'), endDate: new Date('2026-10-10T02:59:59Z'), isClosed: true, blocks: [] };
  repository.findExceptions.mockResolvedValue([exception] as never);
  await planner.plan(candidate, now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  repository.findExceptions.mockResolvedValue([{ ...exception, isClosed: false, blocks: [{ opensAt: 600, closesAt: 720 }] }] as never);
  await planner.plan(candidate, now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
  await planner.plan(candidate, new Date('2026-10-09T12:00Z'));
  expect(notifications.createOccurrence.mock.calls[0][0].payload.workingHours).toBe('10:00–12:00');
});
it.each([null, new Date('2026-10-09T10:00Z'), now])('skips empty or already-started agendas: %s', async (first) => {
  const { planner, repository, notifications } = setup();
  repository.getAgenda.mockResolvedValue({ _count: { _all: first ? 1 : 0 }, _min: { startsAt: first } } as never);
  await planner.plan(candidate, now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('reconsiders an initially empty agenda within the window and expires at due plus two hours', async () => {
  const { planner, repository, notifications } = setup();
  repository.getAgenda.mockResolvedValueOnce({ _count: { _all: 0 }, _min: { startsAt: null } } as never);
  await planner.plan(candidate, now);
  repository.getAgenda.mockResolvedValue({ _count: { _all: 1 }, _min: { startsAt: new Date('2026-10-09T17:00Z') } });
  await planner.plan(candidate, new Date('2026-10-09T11:05Z'));
  expect(notifications.createOccurrence.mock.calls[0][0].expiresAt).toEqual(new Date('2026-10-09T13:00Z'));
  notifications.createOccurrence.mockClear();
  await planner.plan(candidate, new Date('2026-10-09T13:00Z'));
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('omits the email dashboard link for unlinked or other-tenant users', async () => {
  const { planner, notifications } = setup();
  await planner.plan({ ...candidate, user: null }, now);
  expect(notifications.createOccurrence.mock.calls[0][0].payload.agendaUrl).toBeUndefined();
  await planner.plan({ ...candidate, user: { memberships: [{ tenantId: 'other' }] } }, now);
  expect(notifications.createOccurrence.mock.calls[1][0].payload.agendaUrl).toBeUndefined();
});
it('does not send a useless 08:00 summary when the first appointment was at 07:00', async () => {
  const { planner, repository, notifications } = setup();
  repository.getAgenda.mockResolvedValue({ _count: { _all: 1 }, _min: { startsAt: new Date('2026-10-09T10:00Z') } });
  await planner.plan({ ...candidate, workingHours: [{ dayOfWeek: 5, opensAt: 420, closesAt: 1080 }] }, now);
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('converts wall-clock minutes on DST days and subtracts an elapsed hour', () => {
  expect(localMinuteInstant('2026-03-08', 540, 'America/New_York')).toEqual(new Date('2026-03-08T13:00Z'));
  expect(morningSummaryDue('2026-03-08', 540, 'America/New_York')).toEqual(new Date('2026-03-08T12:00Z'));
  expect(
    localMinuteInstant('2026-03-09', 0, 'America/New_York').getTime() - localMinuteInstant('2026-03-08', 0, 'America/New_York').getTime(),
  ).toBe(23 * 60 * 60_000);
});
it('advances quiet-hour due times including offsets crossing midnight', () => {
  expect(morningSummaryDue('2026-10-09', 420, 'America/Montevideo')).toEqual(now);
  expect(morningSummaryDue('2026-10-09', 30, 'America/Montevideo')).toEqual(now);
});
it('paginates and isolates individual professional errors', async () => {
  const { planner, repository } = setup();
  const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  repository.findCandidates.mockResolvedValueOnce([candidate, { ...candidate, id: 'second' }] as never).mockResolvedValueOnce([]);
  const eveningPlan = jest.spyOn(planner, 'planEvening').mockResolvedValue(undefined);
  const plan = jest.spyOn(planner, 'plan').mockRejectedValueOnce(new Error('bad timezone')).mockResolvedValue(undefined);
  await planner.handle();
  expect(plan).toHaveBeenCalledTimes(2);
  expect(eveningPlan).toHaveBeenCalledTimes(4);
  expect(repository.findCandidates).toHaveBeenLastCalledWith('second');
  errorLog.mockRestore();
});
it('scopes agenda and exception queries and filters active professionals/businesses', async () => {
  const prisma = {
    professional: { findMany: jest.fn() },
    appointment: { aggregate: jest.fn() },
    scheduleException: { findMany: jest.fn() },
  };
  const repository = new ProfessionalSummaryRepository(prisma as never);
  await repository.findCandidates('last', 25);
  expect(prisma.professional.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { isActive: true, deletedAt: null, tenant: { isActive: true, deletedAt: null }, id: { gt: 'last' } },
      take: 25,
    }),
  );
  await repository.getAgenda('tenant', 'professional', now, now);
  expect(prisma.appointment.aggregate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        tenantId: 'tenant',
        professionalId: 'professional',
        startsAt: { gte: now, lt: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),
  );
  await repository.findExceptions('tenant', 'professional', now, now);
  expect(prisma.scheduleException.findMany.mock.calls[0][0].where).toEqual(
    expect.objectContaining({
      tenantId: 'tenant',
      OR: [{ professionals: { none: {} } }, { professionals: { some: { professionalId: 'professional' } } }],
    }),
  );
});

it('bounds late-shift summaries at quiet hours even if the two-hour window ends later', async () => {
  const { planner, notifications, repository } = setup();
  repository.getAgenda.mockResolvedValue({ _count: { _all: 1 }, _min: { startsAt: new Date('2026-10-10T01:00Z') } });
  const lateShift = { ...candidate, workingHours: [{ dayOfWeek: 5, opensAt: 1290, closesAt: 1440 }] };
  await planner.plan(lateShift, new Date('2026-10-09T23:30Z'));
  expect(notifications.createOccurrence.mock.calls[0][0].expiresAt).toEqual(new Date('2026-10-10T00:00Z'));
  notifications.createOccurrence.mockClear();
  await planner.plan(lateShift, new Date('2026-10-10T00:00Z'));
  expect(notifications.createOccurrence).not.toHaveBeenCalled();
});
it('uses the same occurrence key on repeated runs and fails visibly on an invalid timezone', async () => {
  const { planner, notifications } = setup();
  await planner.plan(candidate, now);
  await planner.plan(candidate, new Date(now.getTime() + 5 * 60_000));
  expect(notifications.createOccurrence.mock.calls[0][0].occurrenceKey).toBe(notifications.createOccurrence.mock.calls[1][0].occurrenceKey);
  await expect(
    planner.plan({ ...candidate, tenant: { ...candidate.tenant, settings: { timeZone: 'Invalid/Zone' } } }, now),
  ).rejects.toThrow();
});
