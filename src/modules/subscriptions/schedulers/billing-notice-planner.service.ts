import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { BillingNoticeStateService } from 'src/modules/subscriptions/billing-notice-state.service';
import { canNotifyRenewal } from 'src/modules/subscriptions/utils/renewal-projection';
import { BillingNoticeRepository } from '../repositories/billing-notice.repository';
import { NotificationsService } from '../../notifications/application/services/notifications.service';
import { billingNoticeWindow, billingTimeZone } from '../utils/billing-notice-time';
import type { BillingNoticeType } from '../types/billing-notice.type';
import { appointmentUrl } from '../../notifications/application/templates/_components/appointment-links';

@Injectable()
export class BillingNoticePlanner {
  private readonly logger = new Logger(BillingNoticePlanner.name);
  private running = false;
  constructor(
    private readonly repository: BillingNoticeRepository,
    private readonly subscriptions: BillingNoticeStateService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 */5 * * * *')
  async handle() {
    if (this.running) return;
    this.running = true;
    try {
      let after: string | undefined;
      while (true) {
        const candidates = await this.repository.findCandidates(after);
        if (!candidates.length) break;
        for (let i = 0; i < candidates.length; i += 2) {
          await Promise.all(
            candidates.slice(i, i + 2).map(async (candidate) => {
              try {
                await this.plan(candidate.tenantId, new Date());
              } catch (error) {
                this.logger.error(`Billing notice failed for ${candidate.tenantId}`, error instanceof Error ? error.stack : String(error));
              }
            }),
          );
        }
        after = candidates.at(-1)!.id;
      }
    } finally {
      this.running = false;
    }
  }

  async plan(tenantId: string, now: Date) {
    let state = await this.subscriptions.findState(tenantId);
    if (!state || !state.tenant.slug || !state.tenant.memberships.length) return;
    const zone = billingTimeZone(state.tenant.settings?.timeZone);
    const trial = state.status === 'TRIAL' && state.planId !== 'free';
    const types: BillingNoticeType[] = trial ? ['billing.trial.ends.7d', 'billing.trial.ends.3d'] : ['billing.renewal.3d'];
    if (
      !trial &&
      (state.status !== 'ACTIVE' ||
        !['pro', 'pro_plus'].includes(state.planId) ||
        state.pendingPlanId ||
        state.pendingBillingCycle ||
        state.planChangesAt ||
        state.planChangeUndoRequestedAt ||
        state.endsAt ||
        state.cancelledAt)
    )
      return;
    for (const type of types) {
      // Legacy currentPeriodEnd is a candidate hint only; provider verification is mandatory.
      let eventAt = trial ? state.trialEndsAt : (state.nextRenewalAt ?? state.currentPeriodEnd);
      if (!eventAt || eventAt <= now) continue;
      const offset = type === 'billing.trial.ends.7d' ? 7 : 3;
      let window = billingNoticeWindow(eventAt, offset, zone);
      if (now < window.dueAt || now >= window.expiresAt) continue;
      if (!trial) {
        if (!(await this.subscriptions.ensureRenewalChecked(state, now, zone))) continue;
        const checked = await this.subscriptions.findState(tenantId);
        if (!checked || !canNotifyRenewal(checked, now)) continue;
        state = checked;
        eventAt = state.nextRenewalAt!;
        window = billingNoticeWindow(eventAt, offset, zone);
        if (now < window.dueAt || now >= window.expiresAt) continue;
      }
      const slug = state.tenant.slug;
      if (!slug) continue;
      const actionPath = `/${encodeURIComponent(slug)}/billing${trial ? '/plans' : ''}`;
      const origin = appointmentUrl(this.config.get<string>('FRONTEND_URL') || this.config.get<string>('APP_URL'));
      const actionUrl = origin ? new URL(actionPath, new URL(origin).origin).toString() : undefined;
      for (const owner of state.tenant.memberships) {
        await this.notifications.createOccurrence({
          type,
          tenantId,
          referenceId: state.id,
          recipientType: 'USER',
          recipientId: owner.userId,
          occurrenceKey: `${type}:${tenantId}:${state.id}:${eventAt.toISOString()}:${owner.userId}`,
          expiresAt: window.expiresAt,
          payload: {
            businessName: state.tenant.name || 'tu negocio',
            eventAt: eventAt.toISOString(),
            timeZone: zone,
            dueDate: window.dueDate,
            endDate: formatInTimeZone(eventAt, zone, "dd 'de' MMMM 'de' yyyy", { locale: es }),
            endTime: formatInTimeZone(eventAt, zone, 'HH:mm'),
            actionPath,
            ...(actionUrl ? { actionUrl } : {}),
          },
        });
      }
    }
  }
}
