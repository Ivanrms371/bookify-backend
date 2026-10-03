import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, endOfDay, format, getDay } from 'date-fns';
import { AppointmentStatus } from '../../generated/prisma/enums';
import { AvailabilityService } from '../../modules/availability/availability.service';
import { AvailabilityRepository } from '../../modules/availability/availability.repository';
import { SlotsGenerator } from '../../modules/availability/slots-generator';
import { CUSTOMERS, PROFESSIONALS, SERVICES, TENANT_HOURS, TIME_ZONE } from '../../../prisma/development/fixtures';
import { assertDevelopmentEnvironment } from '../../../prisma/development/development';
import { Booking, localDay, operatingHours, planAppointments, PlannerInput, validateBookings } from '../../../prisma/development/planner';

function input(now: Date): PlannerInput {
  const exceptionDay = localDay(now, 4, TIME_ZONE);
  const closedProfessional = PROFESSIONALS.find((p) => p.hours.some((h) => h.dayOfWeek === getDay(exceptionDay)))!;
  return {
    now,
    timeZone: TIME_ZONE,
    bufferMinutes: 0,
    tenantHours: TENANT_HOURS,
    services: SERVICES,
    customerIds: CUSTOMERS.map((c) => c.id),
    existing: [],
    professionals: PROFESSIONALS.map((p) => ({
      id: p.id,
      hours: p.hours,
      serviceIds: SERVICES.filter((s) => p.services.includes(s.key)).map((s) => s.id),
      slotIntervalMinutes: 15,
      minAdvancedMinutes: 30,
      maxAdvancedDays: 30,
    })),
    exceptions: [
      { startsAt: exceptionDay, endsAt: endOfDay(exceptionDay), isClosed: true, blocks: [], professionalIds: [closedProfessional.id] },
    ],
  };
}
describe('development appointment seed', () => {
  it.each([0, 1, 2, 3, 4, 5, 6])('keeps tomorrow busy and every future day bookable when run on weekday %i', (weekday) => {
    const ctx = input(new TZDate(2026, 9, 4 + weekday, 8, 0, 0, TIME_ZONE));
    const result = planAppointments(ctx);
    const tomorrow = result.days[8];
    expect(tomorrow.occupancyPercent).toBeGreaterThanOrEqual(85);
    expect(tomorrow.occupancyPercent).toBeLessThanOrEqual(90);
    expect(tomorrow.seedAppointments).toBeGreaterThanOrEqual(12);
    expect(result.days.slice(8).every((d) => d.freeSlots > 0 && d.seedAppointments > 0)).toBe(true);
    expect(new Set(result.days.slice(9).map((d) => Math.round(d.occupancyPercent))).size).toBeGreaterThanOrEqual(4);
    for (const day of result.days.slice(9)) {
      const target = [45, 70, 35, 60, 50, 75][result.days.indexOf(day) - 9];
      expect(Math.abs(day.occupancyPercent - target)).toBeLessThanOrEqual(8);
    }
    for (const p of ctx.professionals) {
      const rows = result.appointments.filter((a) => a.professionalId === p.id).sort((a, b) => +a.startsAt - +b.startsAt);
      for (let i = 1; i < rows.length; i++) expect(+rows[i].startsAt).toBeGreaterThanOrEqual(+rows[i - 1].endsAt);
    }
    expect(result.appointments.some((a) => a.status === AppointmentStatus.CANCELLED)).toBe(true);
    expect(result.appointments.some((a) => a.status === AppointmentStatus.NO_SHOW)).toBe(true);
    expect(result.appointments.some((a) => a.durationMinutes === 90)).toBe(true);
    validateBookings(ctx, result.appointments);
  });
  it.each(['2026-12-31T23:59:00-03:00', '2028-02-29T23:59:00-03:00'])('uses local calendar days across boundaries: %s', (date) => {
    const ctx = input(new Date(date));
    const result = planAppointments(ctx);
    expect(result.days[8].date).toBe(format(addDays(new TZDate(ctx.now, TIME_ZONE), 1), 'yyyy-MM-dd'));
    expect(result.days[7].seedAppointments).toBe(0);
    for (const a of result.appointments.filter((a) => a.dayOffset >= 0))
      expect(+a.startsAt).toBeGreaterThanOrEqual(+addMinutes(ctx.now, 30));
    expect(result.days[8].occupancyPercent).toBeGreaterThanOrEqual(85);
  });
  it('is deterministic for a reference execution instant', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    expect(planAppointments(ctx)).toEqual(planAppointments(ctx));
  });
  it('respects manual bookings and customer conflicts without changing them', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    const manual = planAppointments(ctx).appointments.find((a) => a.dayOffset === 1)!;
    ctx.existing = [{ ...manual }];
    const before = JSON.stringify(ctx.existing);
    const result = planAppointments(ctx);
    expect(JSON.stringify(ctx.existing)).toBe(before);
    expect(result.days[8].preservedAppointments).toBe(1);
    validateBookings(ctx, [...ctx.existing, ...result.appointments], result.appointments);
  });
  it('leaves long-service slots on quieter days', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    const result = planAppointments(ctx);
    const lucia = ctx.professionals[2];
    for (let offset = 2; offset <= 7; offset++) {
      const day = localDay(ctx.now, offset, TIME_ZONE);
      const ranges = operatingHours(ctx, lucia, day);
      if (!ranges.length) continue;
      const active = result.appointments.filter((a) => a.professionalId === lucia.id && a.status !== AppointmentStatus.CANCELLED);
      const freeLong = ranges.some((r) => {
        for (let minute = r.opensAt; minute + 90 <= r.closesAt; minute += 15) {
          const start = addMinutes(day, minute),
            end = addMinutes(start, 90);
          if (!active.some((a) => a.startsAt < end && a.endsAt > start)) return true;
        }
        return false;
      });
      expect(freeLong).toBe(true);
    }
  });
  it('also satisfies closing-time and conflict rules with nonzero buffers', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    ctx.bufferMinutes = 10;
    const result = planAppointments(ctx);
    validateBookings(ctx, result.appointments);
    for (const p of ctx.professionals) {
      const active = result.appointments
        .filter((a) => a.professionalId === p.id && a.status !== AppointmentStatus.CANCELLED)
        .sort((a, b) => +a.startsAt - +b.startsAt);
      for (let i = 1; i < active.length; i++) expect(+active[i].startsAt).toBeGreaterThanOrEqual(+addMinutes(active[i - 1].endsAt, 10));
    }
  });
  it('rejects overlaps, invalid schedules and incompatible services', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    const a = planAppointments(ctx).appointments.find((a) => a.dayOffset === 1)!;
    expect(() => validateBookings(ctx, [a, { ...a }])).toThrow('Overlapping');
    expect(() => validateBookings(ctx, [{ ...a, startsAt: addMinutes(a.startsAt, -600) }])).toThrow('schedule');
    expect(() => validateBookings(ctx, [{ ...a, serviceId: 'unknown' }])).toThrow('invalid service');
    expect(() => validateBookings(ctx, [{ ...a, endsAt: addMinutes(a.endsAt, 1) }])).toThrow('schedule');
  });
  it('fails when preserved bookings consume all bookable capacity', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    const day = localDay(ctx.now, 1, TIME_ZONE);
    ctx.existing = ctx.professionals.flatMap((p) =>
      operatingHours(ctx, p, day).map((r): Booking => ({
        professionalId: p.id,
        serviceId: p.serviceIds[0],
        customerId: null,
        startsAt: addMinutes(day, r.opensAt),
        endsAt: addMinutes(day, r.closesAt),
        durationMinutes: r.closesAt - r.opensAt,
        status: AppointmentStatus.CONFIRMED,
      })),
    );
    expect(() => planAppointments(ctx)).toThrow('no required free slot');
  });

  it('honors replacement exception windows while keeping their slot-grid anchor', () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    const day = localDay(ctx.now, 2, TIME_ZONE);
    ctx.exceptions.push({
      startsAt: day,
      endsAt: endOfDay(day),
      isClosed: false,
      professionalIds: [ctx.professionals[1].id],
      blocks: [{ opensAt: 590, closesAt: 780 }],
    });
    const result = planAppointments(ctx);
    const rows = result.appointments.filter((a) => a.dayOffset === 2 && a.professionalId === ctx.professionals[1].id);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const local = new TZDate(row.startsAt, TIME_ZONE);
      const minute = local.getHours() * 60 + local.getMinutes();
      expect((minute - 590) % 15).toBe(0);
      expect(minute + row.durationMinutes).toBeLessThanOrEqual(780);
    }
  });
  it('agrees with the application public listing and mutation validator', async () => {
    const ctx = input(new Date('2026-10-02T11:00:00Z'));
    jest.useFakeTimers().setSystemTime(ctx.now);
    try {
      const plan = planAppointments(ctx);
      const appointments = plan.appointments.map((a, i) => ({ ...a, id: String(i), blocks: [{ startsAt: a.startsAt, endsAt: a.endsAt }] }));
      const repository = {
        getConfigurationContext: (_tenantId: string, professionalId: string, serviceId: string) =>
          Promise.resolve({
            settings: {
              timeZone: ctx.timeZone,
              slotIntervalMinutes: 15,
              minAdvancedMinutes: 30,
              maxAdvancedDays: 30,
              bufferTimeMinutes: ctx.bufferMinutes,
            },
            professional: ctx.professionals.find((p) => p.id === professionalId),
            service: ctx.services.find((s) => s.id === serviceId),
          }),
        getTimelineForRange: ({ professionalId }: { professionalId: string }) =>
          Promise.resolve({
            tenantHours: ctx.tenantHours,
            professionalHours: ctx.professionals.find((p) => p.id === professionalId)!.hours,
            exceptions: ctx.exceptions
              .filter((e) => !e.professionalIds.length || e.professionalIds.includes(professionalId))
              .map((e) => ({
                startDate: e.startsAt,
                endDate: e.endsAt,
                isClosed: e.isClosed,
                blocks: e.blocks,
              })),
            appointments: appointments.filter((a) => a.professionalId === professionalId && a.status !== AppointmentStatus.CANCELLED),
          }),
      };
      const availability = new AvailabilityService(repository as unknown as AvailabilityRepository, new SlotsGenerator());
      for (const appointment of appointments.filter((a) => a.dayOffset > 0)) {
        expect(
          await availability.isSlotAvailable({
            tenantId: 'demo',
            professionalId: appointment.professionalId,
            serviceId: appointment.serviceId,
            startsAt: appointment.startsAt.toISOString(),
            excludeAppointmentId: appointment.id,
          }),
        ).toBe(true);
        expect(
          await availability.isSlotAvailable({
            tenantId: 'demo',
            professionalId: appointment.professionalId,
            serviceId: appointment.serviceId,
            startsAt: appointment.startsAt.toISOString(),
          }),
        ).toBe(false);
      }
      for (let offset = 1; offset <= 7; offset++) {
        for (const professional of ctx.professionals) {
          const date = format(localDay(ctx.now, offset, ctx.timeZone), 'yyyy-MM-dd');
          if (!operatingHours(ctx, professional, localDay(ctx.now, offset, ctx.timeZone)).length) continue;
          const service = ctx.services
            .filter((s) => professional.serviceIds.includes(s.id))
            .sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
          const result = await availability.getAvailableSlotsByDay({
            tenantId: 'demo',
            professionalId: professional.id,
            serviceId: service.id,
            date,
          });
          expect(result.slots.length).toBeGreaterThan(0);
          for (const slot of result.slots)
            expect(
              await availability.isSlotAvailable({
                tenantId: 'demo',
                professionalId: professional.id,
                serviceId: service.id,
                startsAt: slot.startsAt,
              }),
            ).toBe(true);
        }
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects non-development execution before database access', () => {
    expect(() => assertDevelopmentEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://example.invalid/dev' })).toThrow(
      'NODE_ENV',
    );
    expect(() => assertDevelopmentEnvironment({ NODE_ENV: 'development' })).toThrow('DATABASE_URL');
    expect(() => assertDevelopmentEnvironment({ NODE_ENV: 'development', DATABASE_URL: 'postgresql://example.invalid/dev' })).not.toThrow();
  });
});
