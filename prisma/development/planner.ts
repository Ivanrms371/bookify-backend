import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, addMonths, differenceInCalendarDays, endOfDay, endOfMonth, format, getDay, startOfDay, startOfMonth } from 'date-fns';
import { AppointmentStatus } from '../../src/generated/prisma/enums';
import { SlotsGenerator } from '../../src/modules/availability/slots-generator';
import { GenerateSlotsContext, TimeRange } from '../../src/modules/availability/types/slots.types';

export type Hours = TimeRange & { dayOfWeek: number };
export type SeedService = { id: string; durationMinutes: number };
export type SeedProfessional = {
  id: string;
  hours: Hours[];
  serviceIds: string[];
  slotIntervalMinutes: number;
  minAdvancedMinutes: number;
  maxAdvancedDays: number;
};
export type SeedException = { startsAt: Date; endsAt: Date; isClosed: boolean; professionalIds: string[]; blocks: TimeRange[] };
export type Booking = {
  professionalId: string;
  serviceId: string;
  customerId: string | null;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  blocks?: Array<{ startsAt: Date; endsAt: Date }>;
};
export type PlannerInput = {
  now: Date;
  timeZone: string;
  bufferMinutes: number;
  tenantHours: Hours[];
  professionals: SeedProfessional[];
  services: SeedService[];
  exceptions: SeedException[];
  existing: Booking[];
  customerIds: string[];
};
export type PlannedBooking = Booking & { dayOffset: number };
export type DaySummary = {
  date: string;
  seedAppointments: number;
  preservedAppointments: number;
  occupancyPercent: number;
  freeSlots: number;
};
const targets = [0.4, 0.88, 0.45, 0.7, 0.35, 0.6, 0.5, 0.75];
const generator = new SlotsGenerator();
export function localDay(now: Date, offset: number, timeZone: string): TZDate {
  return startOfDay(addDays(new TZDate(now, timeZone), offset));
}
function intersect(a: TimeRange[], b: TimeRange[]): TimeRange[] {
  return a
    .flatMap((x) => b.map((y) => ({ opensAt: Math.max(x.opensAt, y.opensAt), closesAt: Math.min(x.closesAt, y.closesAt) })))
    .filter((range) => range.opensAt < range.closesAt);
}
export function operatingHours(input: PlannerInput, professional: SeedProfessional, day: Date): TimeRange[] {
  const weekday = getDay(new TZDate(day, input.timeZone));
  const tenant = input.tenantHours.filter((h) => h.dayOfWeek === weekday);
  const custom = professional.hours.length ? professional.hours.filter((h) => h.dayOfWeek === weekday) : tenant;
  const start = startOfDay(new TZDate(day, input.timeZone));
  const end = endOfDay(start);
  const exceptions = input.exceptions.filter(
    (e) => e.startsAt <= end && e.endsAt >= start && (!e.professionalIds.length || e.professionalIds.includes(professional.id)),
  );
  if (exceptions.some((e) => e.isClosed)) return [];
  const base = intersect(tenant, custom);
  const replacement = exceptions.flatMap((e) => e.blocks);
  // Both listing and mutation must accept a seed booking, even where their policies differ.
  return generator.resolveOperationalRanges({
    workingHours: replacement.length ? intersect(base, replacement) : base,
    exceptionBlocks: [],
  });
}
// Preserve the application's original slot-grid anchor before restricting candidates to both schedules.
function listingHours(input: PlannerInput, professional: SeedProfessional, day: Date): TimeRange[] {
  const local = new TZDate(day, input.timeZone);
  const base = (professional.hours.length ? professional.hours : input.tenantHours).filter((h) => h.dayOfWeek === getDay(local));
  if (!base.length) return [];
  const exceptions = input.exceptions.filter(
    (e) =>
      e.startsAt <= endOfDay(local) &&
      e.endsAt >= startOfDay(local) &&
      (!e.professionalIds.length || e.professionalIds.includes(professional.id)),
  );
  if (exceptions.some((e) => e.isClosed)) return [];
  return generator.resolveOperationalRanges({ workingHours: base, exceptionBlocks: exceptions.flatMap((e) => e.blocks) });
}
function conflicts(start: Date, end: Date, booking: Booking, buffer: number): boolean {
  if (booking.status === AppointmentStatus.CANCELLED) return false;
  return [{ startsAt: booking.startsAt, endsAt: booking.endsAt }, ...(booking.blocks ?? [])].some(
    (b) => start < addMinutes(b.endsAt, buffer) && addMinutes(end, buffer) > b.startsAt,
  );
}
function candidateSlots(
  input: PlannerInput,
  professional: SeedProfessional,
  service: SeedService,
  day: TZDate,
  busy: Booking[],
  reserved: TimeRange[] = [],
  historical = false,
) {
  const dayEnd = endOfDay(day);
  busy = busy.filter((booking) => booking.startsAt <= dayEnd && booking.endsAt >= day);
  const ranges = operatingHours(input, professional, day);
  const ctx: GenerateSlotsContext = {
    targetDate: format(day, 'yyyy-MM-dd'),
    timeZone: input.timeZone,
    serviceDuration: service.durationMinutes,
    slotInterval: professional.slotIntervalMinutes,
    bufferMinutes: input.bufferMinutes,
    minAdvancedMinutes: professional.minAdvancedMinutes,
    maxAdvancedDays: professional.maxAdvancedDays,
    workingHours: listingHours(input, professional, day),
    isFullyClosed: false,
    exceptionBlocks: [],
    busyIntervalsUtc: busy
      .filter((b) => b.professionalId === professional.id && b.status !== AppointmentStatus.CANCELLED)
      .flatMap((b) => [{ startsAt: b.startsAt, endsAt: b.endsAt }, ...(b.blocks ?? [])]),
  };
  return generator.generateAppointmentAvailability(ctx).filter((slot) => {
    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt);
    const minutes = new TZDate(start, input.timeZone).getHours() * 60 + new TZDate(start, input.timeZone).getMinutes();
    return (
      slot.status !== 'busy' &&
      (historical ||
        (start >= addMinutes(input.now, professional.minAdvancedMinutes) &&
          start <= endOfDay(addDays(new TZDate(input.now, input.timeZone), professional.maxAdvancedDays)))) &&
      ranges.some((r) => minutes >= r.opensAt && minutes + service.durationMinutes + input.bufferMinutes <= r.closesAt) &&
      !reserved.some((r) => minutes < r.closesAt && minutes + service.durationMinutes + input.bufferMinutes > r.opensAt) &&
      !busy.some((b) => b.professionalId === professional.id && conflicts(start, end, b, input.bufferMinutes))
    );
  });
}
export function validateBookings(input: PlannerInput, bookings: Booking[], generated: Booking[] = bookings): void {
  for (const booking of bookings) {
    if (booking.status === AppointmentStatus.CANCELLED && !generated.includes(booking)) continue;
    const professional = input.professionals.find((p) => p.id === booking.professionalId);
    if (!professional) continue; // Manual bookings for non-fixture professionals are preserved separately.
    const day = localDay(booking.startsAt, 0, input.timeZone);
    const start = new TZDate(booking.startsAt, input.timeZone);
    const minute = start.getHours() * 60 + start.getMinutes();
    if (
      booking.endsAt.getTime() !== addMinutes(booking.startsAt, booking.durationMinutes).getTime() ||
      format(start, 'yyyy-MM-dd') !== format(new TZDate(booking.endsAt, input.timeZone), 'yyyy-MM-dd') ||
      !operatingHours(input, professional, day).some(
        (r) => minute >= r.opensAt && minute + booking.durationMinutes + input.bufferMinutes <= r.closesAt,
      )
    ) {
      throw new Error(`Appointment outside valid schedule: ${professional.id} ${booking.startsAt.toISOString()}`);
    }
    if (generated.includes(booking)) {
      const service = input.services.find((s) => s.id === booking.serviceId);
      if (
        !service ||
        !professional.serviceIds.includes(service.id) ||
        service.durationMinutes !== booking.durationMinutes ||
        (minute - listingHours(input, professional, day).find((r) => minute >= r.opensAt && minute < r.closesAt)!.opensAt) %
          professional.slotIntervalMinutes !==
          0
      ) {
        throw new Error('Seed appointment has an invalid service, duration, or slot grid.');
      }
    }
  }
  const active = bookings
    .filter((b) => b.status !== AppointmentStatus.CANCELLED)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (
        (active[i].professionalId === active[j].professionalId ||
          (active[i].customerId && active[i].customerId === active[j].customerId)) &&
        conflicts(
          active[j].startsAt,
          active[j].endsAt,
          active[i],
          active[i].professionalId === active[j].professionalId ? input.bufferMinutes : 0,
        )
      ) {
        throw new Error('Overlapping professional/customer appointments; preserved bookings were not changed.');
      }
    }
  }
}
export function planAppointments(input: PlannerInput): { appointments: PlannedBooking[]; days: DaySummary[] } {
  const busy = [...input.existing];
  const appointments: PlannedBooking[] = [];
  const days: DaySummary[] = [];
  validateBookings(input, input.existing, []);
  const today = localDay(input.now, 0, input.timeZone);
  const firstOffset = differenceInCalendarDays(startOfMonth(addMonths(today, -2)), today);
  const lastOffset = Math.max(7, differenceInCalendarDays(endOfMonth(today), today));
  for (let offset = firstOffset; offset <= lastOffset; offset++) {
    const day = localDay(input.now, offset, input.timeZone);
    let capacity = 0;
    for (const professional of input.professionals) {
      const ranges = operatingHours(input, professional, day);
      const minutes = ranges.reduce((total, r) => total + r.closesAt - r.opensAt, 0);
      capacity += minutes;
      if (!minutes) continue;
      const services = input.services.filter((s) => professional.serviceIds.includes(s.id));
      const shortest = [...services].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
      if (!shortest) throw new Error('Working professional has no seeded services.');
      const reserved: TimeRange[] = [];
      if (offset > 0) {
        const gapService = offset === 1 ? shortest : [...services].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
        const free = candidateSlots(input, professional, gapService, day, busy);
        const gap = free[Math.floor(free.length / 2)];
        if (!gap) throw new Error(`Preserved bookings leave no required free slot on ${format(day, 'yyyy-MM-dd')}.`);
        const start = new TZDate(gap.startsAt, input.timeZone);
        const minute = start.getHours() * 60 + start.getMinutes();
        reserved.push({ opensAt: minute, closesAt: minute + gapService.durationMinutes + input.bufferMinutes });
      }
      const occupancyTarget = offset < 0
        ? 0.35 + ((offset - firstOffset) % 5) * 0.08
        : targets[offset <= 7 ? offset : 2 + ((offset - 8) % 6)];
      const target = Math.floor((minutes * occupancyTarget) / professional.slotIntervalMinutes) * professional.slotIntervalMinutes;
      let occupied = busy
        .filter(
          (b) =>
            b.professionalId === professional.id &&
            b.status !== AppointmentStatus.CANCELLED &&
            format(new TZDate(b.startsAt, input.timeZone), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'),
        )
        .reduce((n, b) => n + b.durationMinutes, 0);
      let sequence = 0;
      while (occupied < target) {
        const rotated = services.map((_, i) => services[(i + sequence + offset + (offset < 0 ? -firstOffset : 7)) % services.length]);
        const choices = rotated.filter((s) => {
          const remaining = target - occupied - s.durationMinutes;
          return remaining === 0 || remaining >= shortest.durationMinutes;
        });
        let selected: { service: SeedService; startsAt: Date; endsAt: Date; customerId: string } | undefined;
        for (const service of choices) {
          for (const slot of candidateSlots(input, professional, service, day, busy, reserved, offset < 0)) {
            const start = new Date(slot.startsAt),
              end = new Date(slot.endsAt);
            const customerId = input.customerIds
              .map((_, i) => input.customerIds[(i + appointments.length * 7) % input.customerIds.length])
              .find((id) => !busy.some((b) => b.customerId === id && conflicts(start, end, b, 0)));
            if (customerId) {
              selected = { service, startsAt: start, endsAt: end, customerId };
              break;
            }
          }
          if (selected) break;
        }
        if (!selected) break;
        const n = appointments.length;
        const status =
          offset < 0
            ? n % 11 === 0
              ? AppointmentStatus.CANCELLED
              : n % 13 === 0
                ? AppointmentStatus.NO_SHOW
                : AppointmentStatus.COMPLETED
            : n % 5 === 0
              ? AppointmentStatus.PENDING
              : AppointmentStatus.CONFIRMED;
        const booking: PlannedBooking = {
          professionalId: professional.id,
          serviceId: selected.service.id,
          customerId: selected.customerId,
          startsAt: selected.startsAt,
          endsAt: selected.endsAt,
          durationMinutes: selected.service.durationMinutes,
          status,
          dayOffset: offset,
        };
        appointments.push(booking);
        busy.push(booking);
        if (status === AppointmentStatus.CANCELLED) {
          const start = new TZDate(booking.startsAt, input.timeZone);
          const minute = start.getHours() * 60 + start.getMinutes();
          reserved.push({ opensAt: minute, closesAt: minute + booking.durationMinutes + input.bufferMinutes });
        }
        // Cancelled history is an example record, not additional capacity to fill indefinitely.
        occupied += booking.durationMinutes;
        sequence++;
      }
    }
    const date = format(day, 'yyyy-MM-dd');
    const onDay = (b: Booking) => format(new TZDate(b.startsAt, input.timeZone), 'yyyy-MM-dd') === date;
    const active = busy.filter(
      (b) => onDay(b) && b.status !== AppointmentStatus.CANCELLED && input.professionals.some((p) => p.id === b.professionalId),
    );
    const freeSlots = input.professionals.reduce((n, p) => {
      const shortest = input.services.filter((s) => p.serviceIds.includes(s.id)).sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
      return n + (shortest ? candidateSlots(input, p, shortest, day, busy).length : 0);
    }, 0);
    if (offset > 0 && !freeSlots) throw new Error(`No public availability remains on ${date}.`);
    days.push({
      date,
      seedAppointments: appointments.filter(onDay).length,
      preservedAppointments: input.existing.filter(onDay).length,
      occupancyPercent: capacity ? Math.round((active.reduce((n, b) => n + b.durationMinutes, 0) / capacity) * 1000) / 10 : 0,
      freeSlots,
    });
  }
  validateBookings(input, busy, appointments);
  return { appointments, days };
}
