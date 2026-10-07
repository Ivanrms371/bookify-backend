import { Prisma } from 'src/generated/prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import type { AppointmentTotals, StatsAppointment } from './types/appointment-stats.types';

export const statsDay = (date: Date, timeZone: string) => formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
export const statsDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

export function appointmentTotals(rows: StatsAppointment[], firstVisits: Set<string> = new Set()): AppointmentTotals {
  const totals: AppointmentTotals = {
    appointments: rows.length,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0,
    revenue: new Prisma.Decimal(0),
    newCustomers: 0,
  };
  for (const row of rows) {
    if (row.status === 'CONFIRMED') totals.confirmed++;
    if (row.status === 'CANCELLED') totals.cancelled++;
    if (row.status === 'NO_SHOW') totals.noShow++;
    if (row.status === 'COMPLETED') {
      totals.completed++;
      totals.revenue = totals.revenue.plus(row.price.minus(row.discountAmount));
      if (firstVisits.has(row.id)) totals.newCustomers++;
    }
  }
  return totals;
}

// Appointment time (then ID), rather than the time the Complete button was pressed.
export function firstCompletedVisits(rows: StatsAppointment[]): Set<string> {
  const first = new Map<string, StatsAppointment>();
  for (const row of rows) {
    if (row.status !== 'COMPLETED' || !row.customerId) continue;
    const previous = first.get(row.customerId);
    if (!previous || row.startsAt < previous.startsAt || (row.startsAt.getTime() === previous.startsAt.getTime() && row.id < previous.id)) {
      first.set(row.customerId, row);
    }
  }
  return new Set([...first.values()].map((row) => row.id));
}

export function groupAppointments(rows: StatsAppointment[], key: (row: StatsAppointment) => string | null) {
  const groups = new Map<string, StatsAppointment[]>();
  for (const row of rows) {
    const group = key(row);
    if (group === null) continue;
    const entries = groups.get(group) ?? [];
    entries.push(row);
    groups.set(group, entries);
  }
  return groups;
}

// Decimal/date values compare by value, so unchanged projections do not rewrite rows.
export function matchesProjection(existing: Record<string, unknown> | null | undefined, data: Record<string, unknown>) {
  if (!existing) return false;
  return Object.entries(data).every(([key, value]) => {
    const previous = existing[key];
    if (value instanceof Date) return previous instanceof Date && value.getTime() === previous.getTime();
    if (value === null) return previous === null;
    return previous !== undefined && String(previous) === String(value);
  });
}
