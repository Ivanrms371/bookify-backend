import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { Prisma } from '../../src/generated/prisma/client';
import { TransactionClient } from '../../src/generated/prisma/internal/prismaNamespace';
import { AppointmentStatus } from '../../src/generated/prisma/enums';

/** Derived display data is rebuilt from all persisted demo-tenant records, including manual records. */
export async function reconcileStatistics(tx: TransactionClient, tenantId: string, timeZone: string, now: Date) {
  const [appointments, customers, professionals] = await Promise.all([
    tx.appointment.findMany({ where: { tenantId }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }] }),
    tx.customer.findMany({ where: { tenantId } }),
    tx.professional.findMany({ where: { tenantId } }),
  ]);
  const key = (date: Date) => format(new TZDate(date, timeZone), 'yyyy-MM-dd');
  const dateValue = (day: string) => new Date(`${day}T00:00:00.000Z`); // Prisma @db.Date stores calendar labels.
  const zero = () => new Prisma.Decimal(0);
  const revenue = (a: (typeof appointments)[number]) =>
    a.status === AppointmentStatus.COMPLETED ? a.price.minus(a.discountAmount) : zero();
  function counts(rows: typeof appointments) {
    return {
      appointments: rows.length,
      confirmed: rows.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      cancelled: rows.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
      completed: rows.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      noShow: rows.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
      revenue: rows.reduce((sum, a) => sum.plus(revenue(a)), zero()),
    };
  }
  const all = counts(appointments);
  const lifetime = {
    totalAppointments: all.appointments,
    totalRevenue: all.revenue,
    totalCustomers: customers.filter((c) => !c.deletedAt).length,
    totalCancelled: all.cancelled,
    totalCompleted: all.completed,
    totalNoShow: all.noShow,
  };
  await tx.tenantLifetimeStats.upsert({ where: { tenantId }, create: { tenantId, ...lifetime }, update: lifetime });
  await tx.tenantDailyStats.deleteMany({ where: { tenantId } });
  const tenantDays = [...new Set([...appointments.map((a) => key(a.startsAt)), ...customers.map((c) => key(c.createdAt))])].sort();
  if (tenantDays.length)
    await tx.tenantDailyStats.createMany({
      data: tenantDays.map((day) => ({
        tenantId,
        date: dateValue(day),
        ...counts(appointments.filter((a) => key(a.startsAt) === day)),
        newCustomers: customers.filter((c) => key(c.createdAt) === day).length,
      })),
    });

  await tx.professionalDailyStats.deleteMany({ where: { tenantId } });
  for (const professional of professionals) {
    const rows = appointments.filter((a) => a.professionalId === professional.id);
    const c = counts(rows);
    const firstByCustomer = new Map<string, (typeof rows)[number]>();
    for (const row of rows) if (row.customerId && !firstByCustomer.has(row.customerId)) firstByCustomer.set(row.customerId, row);
    const data = {
      totalAppointments: c.appointments,
      totalRevenue: c.revenue,
      totalCancelled: c.cancelled,
      totalCompleted: c.completed,
      totalNoShow: c.noShow,
      totalNewCustomers: firstByCustomer.size,
    };
    await tx.professionalLifetimeStats.upsert({
      where: { professionalId: professional.id },
      create: { tenantId, professionalId: professional.id, ...data },
      update: data,
    });
    const days = [...new Set(rows.map((a) => key(a.startsAt)))].sort();
    if (days.length)
      await tx.professionalDailyStats.createMany({
        data: days.map((day) => {
          const daily = counts(rows.filter((a) => key(a.startsAt) === day));
          return {
            tenantId,
            professionalId: professional.id,
            date: dateValue(day),
            appointments: daily.appointments,
            cancelled: daily.cancelled,
            completed: daily.completed,
            noShow: daily.noShow,
            revenue: daily.revenue,
            newCustomers: [...firstByCustomer.values()].filter((a) => key(a.startsAt) === day).length,
          };
        }),
      });
  }
  for (const customer of customers) {
    const rows = appointments.filter((a) => a.customerId === customer.id);
    const c = counts(rows);
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        totalAppointments: c.appointments,
        completedAppointments: c.completed,
        cancelledAppointments: c.cancelled,
        noShowCount: c.noShow,
        totalSpent: c.revenue,
        firstAppointmentAt: rows[0]?.startsAt ?? null,
        lastAppointmentAt: rows.at(-1)?.startsAt ?? null,
      },
    });
  }
  // Usage counts the creation month, not the service-delivery month.
  const periods = new Map<string, { periodMonth: number; periodYear: number; appointmentCount: number }>();
  for (const date of [now, ...appointments.map((a) => a.createdAt)]) {
    // Match existing usage service conventions, which use the process-local calendar.
    const periodMonth = date.getMonth() + 1,
      periodYear = date.getFullYear();
    const id = `${periodYear}-${periodMonth}`;
    if (!periods.has(id)) periods.set(id, { periodMonth, periodYear, appointmentCount: 0 });
  }
  for (const appointment of appointments)
    periods.get(`${appointment.createdAt.getFullYear()}-${appointment.createdAt.getMonth() + 1}`)!.appointmentCount++;
  const existingUsage = await tx.tenantUsage.findMany({ where: { tenantId } });
  for (const period of existingUsage)
    if (!periods.has(`${period.periodYear}-${period.periodMonth}`)) {
      await tx.tenantUsage.update({ where: { id: period.id }, data: { appointmentCount: 0 } });
    }
  for (const period of periods.values()) {
    const where = { tenantId, periodMonth: period.periodMonth, periodYear: period.periodYear };
    await tx.tenantUsage.upsert({
      where: { tenantId_periodMonth_periodYear: where },
      create: { ...where, appointmentCount: period.appointmentCount, lastResetAt: now, emailLimit: 1200, whatsappLimit: 500 },
      update: { appointmentCount: period.appointmentCount, emailLimit: 1200, whatsappLimit: 500 },
    });
  }
}
