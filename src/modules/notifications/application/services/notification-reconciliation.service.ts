import { Injectable, Logger } from '@nestjs/common';
import { EmailGateway } from '../../infraestructure/gateways/email.gateway';
import { NotificationReconciliationRepository } from '../../infraestructure/repositories/notification-reconciliation.repository';
import { NotificationFinalizationService } from './notification-finalization.service';
import type { ReconciliationStats } from '../../types/notification-reconciliation.type';

@Injectable()
export class NotificationReconciliationService {
  private readonly logger = new Logger(NotificationReconciliationService.name);
  constructor(
    private readonly repository: NotificationReconciliationRepository,
    private readonly emails: EmailGateway,
    private readonly finalization: NotificationFinalizationService,
  ) {}

  async run(now = new Date()): Promise<ReconciliationStats> {
    const cutoff = new Date(now.getTime() - 15 * 60_000);
    const stats: ReconciliationStats = {
      checked: 0,
      resolved: 0,
      unresolved: 0,
      withoutProviderId: await this.repository.countWithoutProviderId(cutoff),
    };
    let after: string | undefined;
    while (true) {
      const page = await this.repository.candidates(cutoff, after);
      if (!page.length) break;
      for (let i = 0; i < page.length; i += 2) {
        await Promise.all(
          page.slice(i, i + 2).map(async (delivery) => {
            stats.checked++;
            try {
              const acceptance = await this.emails.getAcceptance(delivery.externalReferenceId!);
              if (!acceptance) {
                stats.unresolved++;
                return;
              }
              const result = await this.finalization.resolve({
                deliveryId: delivery.id,
                tenantId: delivery.notification.tenantId,
                source: 'cron',
                outcome: 'accepted',
                operator: 'resend-reconciliation-cron',
                evidence: `Resend GET email ${acceptance.id}`,
                providerId: acceptance.id,
                acceptedAt: acceptance.acceptedAt,
              });
              if (result.changed) stats.resolved++;
            } catch {
              // Fail closed; do not log provider bodies, recipients or credentials.
              stats.unresolved++;
              this.logger.warn(`Email delivery ${delivery.id} still requires reconciliation`);
            }
          }),
        );
      }
      after = page[page.length - 1].id;
      if (page.length < 50) break;
    }
    if (stats.checked || stats.withoutProviderId) this.logger.log(`Email reconciliation ${JSON.stringify(stats)}`);
    return stats;
  }
}
