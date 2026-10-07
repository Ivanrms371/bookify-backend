import { Prisma } from 'src/generated/prisma/client';
import { appointmentTotals, firstCompletedVisits, matchesProjection, statsDate, statsDay } from '../appointment-stats-projection';
import { AppointmentStatsService } from '../appointment-stats.service';
import { AppointmentStatsRepository } from '../appointment-stats.repository';
import type { StatsAppointment } from '../types/appointment-stats.types';

const row = (patch: Partial<StatsAppointment> = {}): StatsAppointment => ({
  id: 'a',
  professionalId: 'p',
  customerId: 'c',
  status: 'CONFIRMED',
  startsAt: new Date('2026-10-07T01:00:00Z'),
  price: new Prisma.Decimal('100.10'),
  discountAmount: new Prisma.Decimal('10.05'),
  ...patch,
});

describe('appointment statistics projections', () => {
  it('skips unchanged Decimal/date projections without relying on object identity', () => {
    expect(matchesProjection({ revenue: new Prisma.Decimal('90.05'), date: statsDate('2026-10-06') },
      { revenue: new Prisma.Decimal('90.05'), date: statsDate('2026-10-06') })).toBe(true);
    expect(matchesProjection({ revenue: new Prisma.Decimal('90.05') }, { revenue: new Prisma.Decimal('100') })).toBe(false);
  });
  it('counts all bookings, current confirmed states and only completed revenue with decimal precision', () => {
    const rows = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].map((status, index) =>
      row({ id: String(index), status: status as StatsAppointment['status'] }),
    );
    const totals = appointmentTotals(rows);
    expect(totals).toMatchObject({ appointments: 5, confirmed: 1, cancelled: 1, completed: 1, noShow: 1 });
    expect(totals.revenue.toString()).toBe('90.05');
  });

  it('counts first completed visits once and moves them when an earlier visit is completed/corrected', () => {
    const later = row({ id: 'later', status: 'COMPLETED', startsAt: new Date('2026-10-08T12:00:00Z') });
    const earlier = row({ id: 'earlier', status: 'COMPLETED' });
    expect([...firstCompletedVisits([later, earlier])]).toEqual(['earlier']);
    expect(appointmentTotals([earlier, later], firstCompletedVisits([earlier, later])).newCustomers).toBe(1);
    expect([...firstCompletedVisits([later, { ...earlier, status: 'NO_SHOW' }])]).toEqual(['later']);
    expect(firstCompletedVisits([row({ customerId: null, status: 'COMPLETED' })]).size).toBe(0);
  });

  it('uses tenant calendar dates with UTC date-only storage, including midnight and DST', () => {
    expect(statsDay(row().startsAt, 'America/Montevideo')).toBe('2026-10-06');
    expect(statsDay(row().startsAt, 'Asia/Tokyo')).toBe('2026-10-07');
    expect(statsDay(new Date('2026-11-01T05:30:00Z'), 'America/New_York')).toBe('2026-11-01');
    expect(statsDate('2026-10-06').toISOString()).toBe('2026-10-06T00:00:00.000Z');
  });

  it('replaces stale totals, clears an old rescheduled day and leaves billing/customer-record counters alone', async () => {
    const upsert = () => jest.fn().mockResolvedValue(undefined);
    const tx = {
      tenantSettings: { findUnique: jest.fn().mockResolvedValue({ timeZone: 'America/Montevideo' }) },
      appointment: { findMany: jest.fn().mockResolvedValue([row({ status: 'COMPLETED' })]) },
      tenantLifetimeStats: { findUnique: jest.fn().mockResolvedValue(null), upsert: upsert() },
      tenantDailyStats: { findMany: jest.fn().mockResolvedValue([{ date: statsDate('2026-10-05') }]), upsert: upsert() },
      professional: { findMany: jest.fn().mockResolvedValue([{ id: 'p' }]) },
      professionalLifetimeStats: { findUnique: jest.fn().mockResolvedValue(null), upsert: upsert() },
      professionalDailyStats: { findMany: jest.fn().mockResolvedValue([{ date: statsDate('2026-10-05') }]), upsert: upsert() },
      customer: { findMany: jest.fn().mockResolvedValue([{ id: 'c' }]), update: jest.fn().mockResolvedValue(undefined) },
    };
    const repository = new AppointmentStatsRepository();
    await repository.rebuild('tenant', tx as never);
    expect(tx.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant' } }));
    expect(tx.tenantLifetimeStats.upsert.mock.calls[0][0].update).toMatchObject({ totalAppointments: 1, totalCompleted: 1 });
    expect(tx.tenantLifetimeStats.upsert.mock.calls[0][0].update).not.toHaveProperty('totalCustomers');
    expect(tx.tenantDailyStats.upsert.mock.calls[0][0].update).toMatchObject({ appointments: 0, completed: 0 });
    expect(tx.tenantDailyStats.upsert.mock.calls[1][0].update).toMatchObject({ appointments: 1, completed: 1, newCustomers: 1 });
    expect(tx.customer.update.mock.calls[0][0].data).toMatchObject({
      totalAppointments: 1,
      completedAppointments: 1,
      cancelledAppointments: 0,
    });
    // Repeating the rebuild sets the same values; there are no blind increments.
    const firstWrite = tx.tenantLifetimeStats.upsert.mock.calls[0][0];
    await repository.rebuild('tenant', tx as never);
    expect(tx.tenantLifetimeStats.upsert.mock.calls[1][0]).toEqual(firstWrite);
  });
});

describe('transactional appointment mutations', () => {
  function fixture() {
    const order: string[] = [];
    const tx = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        order.push('lock');
        return [{ id: 'tenant' }];
      }),
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        order.push('begin');
        const result = await callback(tx);
        order.push('commit');
        return result;
      }),
    };
    const repository = {
      rebuild: jest.fn().mockImplementation(async () => {
        order.push('stats');
      }),
    };
    const events = { emit: jest.fn().mockImplementation(() => order.push('event')) };
    return { service: new AppointmentStatsService(prisma as never, repository as never, events as never), order, tx, repository, events };
  }

  it('locks before writes, rebuilds in the same transaction and emits only after commit', async () => {
    const f = fixture();
    await f.service.mutate('tenant', async ({ tx, afterCommit }) => {
      expect(tx).toBe(f.tx);
      f.order.push('write');
      afterCommit('appointment.created', { id: 'a' });
      return 'result';
    });
    expect(f.order).toEqual(['begin', 'lock', 'write', 'stats', 'commit', 'event']);
    expect(f.repository.rebuild).toHaveBeenCalledWith('tenant', f.tx);
  });

  it('does not emit queued events if stats fail', async () => {
    const f = fixture();
    f.repository.rebuild.mockRejectedValue(new Error('stats failed'));
    await expect(f.service.mutate('tenant', async ({ afterCommit }) => afterCommit('appointment.created', {}))).rejects.toThrow(
      'stats failed',
    );
    expect(f.order).not.toContain('commit');
    expect(f.events.emit).not.toHaveBeenCalled();
  });

  it('does not run writes for an unknown tenant', async () => {
    const f = fixture();
    f.tx.$queryRaw.mockResolvedValue([]);
    const write = jest.fn();
    await expect(f.service.mutate('unknown', write)).rejects.toThrow();
    expect(write).not.toHaveBeenCalled();
  });
});
