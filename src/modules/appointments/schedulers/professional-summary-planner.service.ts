import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { formatInTimeZone } from 'date-fns-tz';
import { RecipientType } from 'src/generated/prisma/enums';
import {
  normalizeWorkingRanges,
  resolveScheduleExceptions,
  resolveWorkingHours,
} from 'src/modules/availability/utils/working-schedule.util';
import { ProfessionalSummaryRepository } from '../repositories/professional-summary.repository';
import { NotificationsService } from '../../notifications/application/services/notifications.service';
import {
  localMinuteInstant,
  minuteLabel,
  morningSummaryDue,
  nextLocalDate,
  shiftLocalDate,
  allowedSummaryTime,
} from '../utils/professional-summary-time';
import { appointmentUrl } from '../../notifications/application/templates/_components/appointment-links';
import { appointmentDate } from '../../notifications/application/utils/appointment-date';
import { summarizeProfessionalDay } from '../utils/professional-summary-outcomes';
import type { ProfessionalSummaryCandidate, ProfessionalSummarySchedule } from '../types/professional-summary.type';

@Injectable()
export class ProfessionalSummaryPlanner {
  private readonly logger = new Logger(ProfessionalSummaryPlanner.name);
  private running = false;

  constructor(
    private readonly repository: ProfessionalSummaryRepository,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 */5 * * * *')
  async handle() {
    if (this.running) return;
    this.running = true;
    try {
      let afterId: string | undefined;
      while (true) {
        const candidates = await this.repository.findCandidates(afterId);
        if (!candidates.length) break;
        for (const candidate of candidates) {
          const now = new Date();
          const jobs = [
            () => this.plan(candidate, now),
            () => this.planEvening(candidate, now),
            () => this.planEvening(candidate, now, shiftLocalDate(formatInTimeZone(now, this.timeZoneFor(candidate), 'yyyy-MM-dd'), -1)),
          ];
          for (const job of jobs) {
            try {
              await job();
            } catch (error) {
              this.logger.error(`Summary failed for professional ${candidate.id}`, error instanceof Error ? error.stack : String(error));
            }
          }
        }
        afterId = candidates.at(-1)!.id;
      }
    } finally {
      this.running = false;
    }
  }

  async plan(professional: ProfessionalSummaryCandidate, now: Date) {
    const { tenantId, id: professionalId } = professional;
    const timeZone = this.timeZoneFor(professional);
    const date = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
    const schedule = await this.getDaySchedule(professional, date, timeZone);
    if (!schedule) return;
    const { dayStart, dayEnd, ranges } = schedule;
    const dueAt = morningSummaryDue(date, ranges[0].opensAt, timeZone);
    const windowEnd = new Date(Math.min(dueAt.getTime() + 2 * 60 * 60_000, localMinuteInstant(date, 21 * 60, timeZone).getTime()));
    if (now < dueAt || now >= windowEnd) return;
    const agenda = await this.repository.getAgenda(tenantId, professionalId, dayStart, dayEnd);
    const first = agenda._min.startsAt;
    if (!first || !agenda._count._all || first <= now) return;
    const expiresAt = new Date(Math.min(first.getTime(), windowEnd.getTime()));
    const { agendaPath, agendaUrl } = this.agendaLinks(professional);
    await this.notifications.createOccurrence({
      type: 'professional.day-start',
      tenantId,
      recipientId: professionalId,
      recipientType: RecipientType.PROFESSIONAL,
      occurrenceKey: `${tenantId}:${professionalId}:${date}:day.start`,
      expiresAt,
      payload: {
        professionalName: professional.name,
        date: appointmentDate(dayStart, timeZone).date,
        count: agenda._count._all,
        firstTime: appointmentDate(first, timeZone).time,
        workingHours: ranges.map((range) => `${minuteLabel(range.opensAt)}–${minuteLabel(range.closesAt)}`).join(', '),
        ...(agendaPath ? { agendaPath } : {}),
        ...(agendaUrl ? { agendaUrl } : {}),
      },
    });
  }

  async planEvening(professional: ProfessionalSummaryCandidate, now: Date, businessDate?: string) {
    const { tenantId, id: professionalId } = professional;
    const timeZone = this.timeZoneFor(professional);
    const today = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
    const date = businessDate ?? today;
    const expiresAt = localMinuteInstant(nextLocalDate(date), 12 * 60, timeZone);
    if (now >= expiresAt) return;
    const schedule = await this.getDaySchedule(professional, date, timeZone);
    if (!schedule) return;
    const closing = localMinuteInstant(date, schedule.ranges.at(-1)!.closesAt, timeZone);
    const nominalDue = new Date(closing.getTime() + 60 * 60_000);
    if (now < allowedSummaryTime(nominalDue, timeZone)) return;
    const outcomes = summarizeProfessionalDay(
      await this.repository.getDayOutcomes(tenantId, professionalId, schedule.dayStart, schedule.dayEnd),
    );
    if (!outcomes.totalCount) return;
    const afterAppointments = outcomes.latestEnd ? new Date(outcomes.latestEnd.getTime() + 60 * 60_000) : nominalDue;
    const dueAt = allowedSummaryTime(new Date(Math.max(nominalDue.getTime(), afterAppointments.getTime())), timeZone);
    // Reapply quiet hours to outage/retry catch-up, keeping the original business date.
    if (now < dueAt || now < allowedSummaryTime(now, timeZone)) return;
    const { agendaPath, agendaUrl } = this.agendaLinks(professional, date);
    const snapshot = appointmentDate(now, timeZone);
    await this.notifications.createOccurrence({
      type: 'professional.day-end',
      tenantId,
      recipientId: professionalId,
      recipientType: RecipientType.PROFESSIONAL,
      occurrenceKey: `${tenantId}:${professionalId}:${date}:day.end`,
      expiresAt: new Date(Math.min(expiresAt.getTime(), localMinuteInstant(today, 21 * 60, timeZone).getTime())),
      payload: {
        professionalName: professional.name,
        professionalId,
        businessDate: date,
        date: appointmentDate(schedule.dayStart, timeZone).date,
        completedCount: outcomes.completedCount,
        cancelledCount: outcomes.cancelledCount,
        noShowCount: outcomes.noShowCount,
        unresolvedCount: outcomes.unresolvedCount,
        completedValue: outcomes.completedValue,
        currency: professional.tenant.settings?.currency || 'UYU',
        snapshotTime: `${snapshot.date} a las ${snapshot.time}`,
        ...(agendaPath ? { agendaPath } : {}),
        ...(agendaUrl ? { agendaUrl } : {}),
      },
    });
  }

  private timeZoneFor(professional: ProfessionalSummaryCandidate): string {
    const zone = professional.tenant.settings?.timeZone;
    if (!zone) this.logger.warn(`Missing summary timezone for tenant ${professional.tenantId}; using America/Montevideo`);
    return zone || 'America/Montevideo';
  }

  private async getDaySchedule(
    professional: ProfessionalSummaryCandidate,
    date: string,
    timeZone: string,
  ): Promise<ProfessionalSummarySchedule | undefined> {
    const dayStart = localMinuteInstant(date, 0, timeZone);
    const dayEnd = localMinuteInstant(nextLocalDate(date), 0, timeZone);
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    const hours = resolveWorkingHours(professional.tenant.tenantWorkingHours, professional.workingHours, dayOfWeek);
    if (!hours.length) return;
    const exceptions = await this.repository.findExceptions(professional.tenantId, professional.id, dayStart, dayEnd);
    const { isFullyClosed, exceptionBlocks } = resolveScheduleExceptions(exceptions, dayStart, new Date(dayEnd.getTime() - 1));
    if (isFullyClosed) return;
    const ranges = normalizeWorkingRanges(exceptionBlocks.length ? exceptionBlocks : hours);
    if (!ranges.length) return;
    return { dayStart, dayEnd, ranges };
  }

  private agendaLinks(professional: ProfessionalSummaryCandidate, date?: string) {
    const { tenant, tenantId } = professional;
    let agendaPath = tenant.slug ? `/${encodeURIComponent(tenant.slug)}/calendar` : undefined;
    if (agendaPath && date) {
      const params = new URLSearchParams({ notificationDate: date, notificationProfessionalId: professional.id });
      agendaPath += `?${params}`;
    }
    const frontendUrl = appointmentUrl(this.config.get<string>('FRONTEND_URL') || this.config.get<string>('APP_URL'));
    const hasAccess = professional.user?.memberships.some((membership) => membership.tenantId === tenantId);
    const agendaUrl = frontendUrl && hasAccess && agendaPath ? new URL(agendaPath, frontendUrl).toString() : undefined;
    return { agendaPath, agendaUrl };
  }
}
