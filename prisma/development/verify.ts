import assert from 'node:assert/strict';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { AppointmentStatus } from '../../src/generated/prisma/enums';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { AvailabilityRepository } from '../../src/modules/availability/availability.repository';
import { AvailabilityService } from '../../src/modules/availability/availability.service';
import { SlotsGenerator } from '../../src/modules/availability/slots-generator';
import { assertDevelopmentEnvironment } from './development';
import { CUSTOMERS, PROFESSIONALS, SEED_MARKER, SERVICES, TENANT_ID } from './fixtures';
import { localDay, operatingHours, PlannerInput, validateBookings } from './planner';

/** Read-only verification through the real Prisma repository and availability services. */
export async function verifyDevelopment(prisma: PrismaService, now = new Date()) {
  const [tenant, settings, professionals, services, customers, appointments, exceptions, tenantHours, lifetime, usage] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: TENANT_ID } }),
    prisma.tenantSettings.findUniqueOrThrow({ where: { tenantId: TENANT_ID } }),
    prisma.professional.findMany({ where: { tenantId: TENANT_ID }, include: { workingHours: true, assignments: true } }),
    prisma.service.findMany({ where: { tenantId: TENANT_ID } }),
    prisma.customer.findMany({ where: { tenantId: TENANT_ID } }),
    prisma.appointment.findMany({ where: { tenantId: TENANT_ID }, include: { blocks: true } }),
    prisma.scheduleException.findMany({ where: { tenantId: TENANT_ID }, include: { professionals: true, blocks: true } }),
    prisma.tenantWorkingHours.findMany({ where: { tenantId: TENANT_ID } }),
    prisma.tenantLifetimeStats.findUniqueOrThrow({ where: { tenantId: TENANT_ID } }),
    prisma.tenantUsage.findMany({ where: { tenantId: TENANT_ID } }),
  ]);
  assert(tenant.isActive && tenant.isPublic && tenant.onboardingStatus === 'COMPLETED');
  const input: PlannerInput = {
    now,
    timeZone: settings.timeZone,
    bufferMinutes: settings.bufferTimeMinutes,
    tenantHours,
    services,
    customerIds: customers.map((c) => c.id),
    existing: [],
    professionals: PROFESSIONALS.map((fixture) => {
      const p = professionals.find((p) => p.id === fixture.id)!;
      assert(p && p.isActive && !p.deletedAt && p.userId === fixture.userId);
      return {
        id: p.id,
        hours: p.workingHours,
        serviceIds: p.assignments.filter((a) => a.isActive).map((a) => a.serviceId),
        slotIntervalMinutes: p.slotIntervalMinutes,
        minAdvancedMinutes: p.minAdvancedMinutes,
        maxAdvancedDays: p.maxAdvancedDays,
      };
    }),
    exceptions: exceptions.map((e) => ({
      startsAt: e.startDate,
      endsAt: e.endDate,
      isClosed: e.isClosed,
      blocks: e.blocks,
      professionalIds: e.professionals.map((p) => p.professionalId),
    })),
  };
  for (const fixture of CUSTOMERS) assert(customers.some((c) => c.id === fixture.id));
  for (const fixture of SERVICES) assert(services.some((s) => s.id === fixture.id && s.isActive && !s.deletedAt));
  const generated = appointments.filter((a) => a.internalNotes?.startsWith(SEED_MARKER));
  validateBookings(input, appointments, generated);
  assert.equal(lifetime.totalAppointments, appointments.length);
  assert.equal(lifetime.totalCompleted, appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length);
  assert.equal(lifetime.totalCancelled, appointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length);
  assert.equal(lifetime.totalNoShow, appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length);
  assert.equal(lifetime.totalCustomers, customers.filter((c) => !c.deletedAt).length);
  for (const period of usage)
    assert.equal(
      period.appointmentCount,
      appointments.filter((a) => a.createdAt.getFullYear() === period.periodYear && a.createdAt.getMonth() + 1 === period.periodMonth)
        .length,
    );
  for (const customer of customers)
    assert.equal(customer.totalAppointments, appointments.filter((a) => a.customerId === customer.id).length);
  for (const appointment of generated) {
    const customer = customers.find((c) => c.id === appointment.customerId)!;
    const service = services.find((s) => s.id === appointment.serviceId)!;
    assert(
      customer && service && input.professionals.some((p) => p.id === appointment.professionalId && p.serviceIds.includes(service.id)),
    );
    assert.equal(appointment.customerName, customer.name);
    assert.equal(appointment.customerPhone, customer.phoneNumber);
    assert.equal(appointment.customerEmail, customer.email);
    assert(appointment.price.equals(service.price));
    assert.equal(appointment.blocks.length, appointment.status === AppointmentStatus.CANCELLED ? 0 : 1);
    for (const block of appointment.blocks) {
      assert.equal(+block.startsAt, +appointment.startsAt);
      assert.equal(+block.endsAt, +appointment.endsAt);
    }
  }
  const availability = new AvailabilityService(new AvailabilityRepository(prisma), new SlotsGenerator());
  const days: Array<{ date: string; appointments: number; occupancyPercent: number; freeShortServiceSlots: number }> = [];
  for (let offset = 1; offset <= 7; offset++) {
    const day = localDay(now, offset, settings.timeZone);
    const date = format(day, 'yyyy-MM-dd');
    let capacity = 0,
      freeShortServiceSlots = 0;
    for (const p of input.professionals) {
      const ranges = operatingHours(input, p, day);
      capacity += ranges.reduce((sum, r) => sum + r.closesAt - r.opensAt, 0);
      if (!ranges.length) continue;
      const eligible = SERVICES.filter((s) => p.serviceIds.includes(s.id)).sort((a, b) => a.durationMinutes - b.durationMinutes);
      const shortest = eligible[0];
      const free = await availability.getAvailableSlotsByDay({ tenantId: TENANT_ID, professionalId: p.id, serviceId: shortest.id, date });
      assert(free.slots.length > 0, `No public short-service availability for ${p.id} on ${date}`);
      freeShortServiceSlots += free.slots.length;
      assert(
        await availability.isSlotAvailable({
          tenantId: TENANT_ID,
          professionalId: p.id,
          serviceId: shortest.id,
          startsAt: free.slots[0].startsAt,
        }),
      );
      if (offset > 1) {
        const longest = eligible.at(-1)!;
        const longFree = await availability.getAvailableSlotsByDay({
          tenantId: TENANT_ID,
          professionalId: p.id,
          serviceId: longest.id,
          date,
        });
        assert(longFree.slots.length > 0, `No public long-service availability on ${date}`);
      }
    }
    const rows = appointments.filter(
      (a) =>
        a.status !== AppointmentStatus.CANCELLED &&
        input.professionals.some((p) => p.id === a.professionalId) &&
        format(new TZDate(a.startsAt, settings.timeZone), 'yyyy-MM-dd') === date,
    );
    for (const a of rows.filter((a) => a.internalNotes?.startsWith(SEED_MARKER))) {
      assert(
        await availability.isSlotAvailable({
          tenantId: TENANT_ID,
          professionalId: a.professionalId,
          serviceId: a.serviceId,
          startsAt: a.startsAt.toISOString(),
          excludeAppointmentId: a.id,
        }),
        `Mutation validator rejects seeded booking ${a.id}`,
      );
      assert.equal(
        await availability.isSlotAvailable({
          tenantId: TENANT_ID,
          professionalId: a.professionalId,
          serviceId: a.serviceId,
          startsAt: a.startsAt.toISOString(),
        }),
        false,
      );
    }
    days.push({
      date,
      appointments: rows.length,
      occupancyPercent: Math.round((rows.reduce((sum, a) => sum + a.durationMinutes, 0) / capacity) * 1000) / 10,
      freeShortServiceSlots,
    });
  }
  // Manual records can change targets; enforce targets only for a clean fixture calendar.
  if (!appointments.some((a) => !a.internalNotes?.startsWith(SEED_MARKER))) {
    assert(days[0].occupancyPercent >= 85 && days[0].occupancyPercent <= 90);
    assert(days[0].appointments >= 12);
    assert(new Set(days.slice(1).map((d) => Math.round(d.occupancyPercent))).size >= 4);
  }
  return days;
}
async function main() {
  dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });
  assertDevelopmentEnvironment(process.env);
  const prisma = new PrismaService();
  try {
    console.table(await verifyDevelopment(prisma));
    console.log('Read-only seed verification passed.');
  } finally {
    await prisma.$disconnect();
  }
}
if (require.main === module)
  main().catch((error: unknown) => {
    console.error(
      'Seed verification failed:',
      error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[database URL redacted]') : 'Unknown error',
    );
    process.exitCode = 1;
  });
