import { Injectable } from '@nestjs/common';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import {
  appointmentTotals,
  firstCompletedVisits,
  groupAppointments,
  matchesProjection,
  statsDate,
  statsDay,
} from './appointment-stats-projection';

@Injectable()
export class AppointmentStatsRepository {
  // Replacing projections from source records repairs historical unwired counters and
  // makes corrections/retries safe. Intended for small businesses; no billing usage writes.
  async rebuild(tenantId: string, tx: TransactionClient) {
    const settings = await tx.tenantSettings.findUnique({ where: { tenantId }, select: { timeZone: true } });
    const timeZone = settings?.timeZone ?? 'America/Montevideo';
    const rows = await tx.appointment.findMany({
      where: { tenantId },
      select: { id: true, professionalId: true, customerId: true, status: true, startsAt: true, price: true, discountAmount: true },
    });
    const rowsByDay = groupAppointments(rows, (row) => statsDay(row.startsAt, timeZone));
    const rowsByProfessional = groupAppointments(rows, (row) => row.professionalId);
    const rowsByCustomer = groupAppointments(rows, (row) => row.customerId);
    const firstVisits = firstCompletedVisits(rows);
    const total = appointmentTotals(rows, firstVisits);
    const lifetime = {
      totalAppointments: total.appointments,
      totalCompleted: total.completed,
      totalCancelled: total.cancelled,
      totalNoShow: total.noShow,
      totalRevenue: total.revenue,
    };
    const previousLifetime = await tx.tenantLifetimeStats.findUnique({ where: { tenantId } });
    if (!matchesProjection(previousLifetime, lifetime))
      await tx.tenantLifetimeStats.upsert({ where: { tenantId }, create: { tenantId, ...lifetime }, update: lifetime });

    const previousDays = await tx.tenantDailyStats.findMany({ where: { tenantId } });
    const days = new Set([...previousDays.map((row) => row.date.toISOString().slice(0, 10)), ...rowsByDay.keys()]);
    for (const day of days) {
      const date = statsDate(day);
      const totals = appointmentTotals(rowsByDay.get(day) ?? [], firstVisits);
      const previous = previousDays.find((row) => row.date.getTime() === date.getTime());
      if (!matchesProjection(previous, totals as unknown as Record<string, unknown>))
        await tx.tenantDailyStats.upsert({
          where: { tenantId_date: { tenantId, date } },
          create: { tenantId, date, ...totals },
          update: totals,
        });
    }

    const professionals = await tx.professional.findMany({ where: { tenantId }, select: { id: true } });
    for (const professional of professionals) {
      const professionalRows = rowsByProfessional.get(professional.id) ?? [];
      const professionalRowsByDay = groupAppointments(professionalRows, (row) => statsDay(row.startsAt, timeZone));
      const professionalFirstVisits = firstCompletedVisits(professionalRows);
      const totals = appointmentTotals(professionalRows, professionalFirstVisits);
      const data = {
        totalAppointments: totals.appointments,
        totalCompleted: totals.completed,
        totalCancelled: totals.cancelled,
        totalNoShow: totals.noShow,
        totalRevenue: totals.revenue,
        totalNewCustomers: totals.newCustomers,
      };
      const professionalId = professional.id;
      const previousLifetime = await tx.professionalLifetimeStats.findUnique({ where: { professionalId } });
      if (!matchesProjection(previousLifetime, data))
        await tx.professionalLifetimeStats.upsert({
          where: { professionalId },
          create: { tenantId, professionalId, ...data },
          update: data,
        });
      const oldDays = await tx.professionalDailyStats.findMany({ where: { tenantId, professionalId } });
      const professionalDays = new Set([...oldDays.map((row) => row.date.toISOString().slice(0, 10)), ...professionalRowsByDay.keys()]);
      for (const day of professionalDays) {
        const date = statsDate(day);
        const { confirmed, ...daily } = appointmentTotals(professionalRowsByDay.get(day) ?? [], professionalFirstVisits);
        const previous = oldDays.find((row) => row.date.getTime() === date.getTime());
        if (!matchesProjection(previous, daily))
          await tx.professionalDailyStats.upsert({
            where: { professionalId_date: { professionalId, date } },
            create: { tenantId, professionalId, date, ...daily },
            update: daily,
          });
      }
    }

    const customers = await tx.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        totalAppointments: true,
        completedAppointments: true,
        cancelledAppointments: true,
        noShowCount: true,
        totalSpent: true,
        firstAppointmentAt: true,
        lastAppointmentAt: true,
      },
    });
    for (const customer of customers) {
      const visits = (rowsByCustomer.get(customer.id) ?? []).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      const totals = appointmentTotals(visits);
      const data = {
        totalAppointments: totals.appointments,
        completedAppointments: totals.completed,
        cancelledAppointments: totals.cancelled,
        noShowCount: totals.noShow,
        totalSpent: totals.revenue,
        firstAppointmentAt: visits[0]?.startsAt ?? null,
        lastAppointmentAt: visits.at(-1)?.startsAt ?? null,
      };
      if (!matchesProjection(customer, data)) await tx.customer.update({ where: { id: customer.id, tenantId }, data });
    }
  }
}
