import { confirmsUpgradePayment, projectProviderPlanChange } from './plan-change';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Subscription } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { ProviderSyncRepository } from 'src/common/webhooks/repositories/provider-sync.repository';
import { PaymentsService } from '../payments/payments.service';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import type {
  LemonSqueezyInvoiceData,
  LemonSqueezySubscriptionData,
  LemonSqueezyWebhookPayload,
} from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import { PlansService } from './plans.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { toProviderSubscriptionUpdate } from './mappers/provider-subscription.mapper';
import { PrismaService } from 'src/shared/prisma/prisma.service';

const INVOICE_EVENTS = new Set([
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_payment_recovered',
  'subscription_payment_refunded',
]);
const LIFECYCLE_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
]);

@Injectable()
export class SubscriptionWebhookService {
  private readonly logger = new Logger(SubscriptionWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly plansService: PlansService,
    private readonly lemonSqueezyService: LemonSqueezyService,
    private readonly paymentsService: PaymentsService,
    private readonly providerSync: ProviderSyncRepository,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string) {
    const payload = this.lemonSqueezyService.verifyWebhookSignature(rawBody, signature);
    if (!INVOICE_EVENTS.has(payload.meta.event_name) && !LIFECYCLE_EVENTS.has(payload.meta.event_name)) {
      return;
    }
    const resource = `${payload.data.type}:${payload.data.id}`;
    // The provider webhook configuration ID is not a delivery identifier.
    const requestId = `LEMON_SQUEEZY:failure:${createHash('sha256').update(rawBody).digest('hex')}`;
    try {
      const { subscription, invoice, latestInvoice } = await this.loadProviderState(payload);
      await this.prisma.$transaction(async (tx) => {
        await this.providerSync.acquireLock(tx);

        const local = await this.synchronizeSubscription(subscription, payload, tx, latestInvoice);

        if (invoice) {
          await this.synchronizeInvoice(invoice, local, payload.meta.event_name === 'subscription_payment_failed', tx);
        }

        await this.providerSync.resolveFailure(requestId, tx);
      });
    } catch (error) {
      await this.recordFailure(requestId, resource);
      throw error;
    }
  }

  // Provider HTTP reads happen before the transaction; delayed payloads are never projected directly.
  private async loadProviderState(payload: LemonSqueezyWebhookPayload) {
    const isInvoice = INVOICE_EVENTS.has(payload.meta.event_name);
    if (!isInvoice && payload.data.type !== 'subscriptions') {
      throw new BadRequestException('Subscription payload required.');
    }
    if (isInvoice && payload.data.type !== 'subscription-invoices') {
      throw new BadRequestException('Invoice payload required.');
    }

    const invoice = isInvoice ? await this.lemonSqueezyService.retrieveInvoice(payload.data.id) : null;
    if (invoice) {
      this.assertCaughtUp(invoice.attributes.updated_at, payload.data.attributes.updated_at, 'invoice');
      if (payload.data.type === 'subscription-invoices' && invoice.attributes.subscription_id !== payload.data.attributes.subscription_id) {
        throw new BadRequestException('Invoice subscription mismatch.');
      }
    }
    const providerId = invoice ? String(invoice.attributes.subscription_id) : payload.data.id;
    const subscription = await this.lemonSqueezyService.retrieveSubscription(providerId);
    if (!invoice) {
      this.assertCaughtUp(subscription.attributes.updated_at, payload.data.attributes.updated_at, 'subscription');
    }
    if (invoice && subscription.attributes.customer_id !== invoice.attributes.customer_id) {
      throw new BadRequestException('Invoice customer mismatch.');
    }
    const canConfirmUpgrade = invoice && ['updated', 'renewal'].includes(invoice.attributes.billing_reason ?? '');
    const latest = canConfirmUpgrade ? await this.lemonSqueezyService.retrieveLatestInvoice(providerId) : null;
    const latestInvoice = latest?.id === invoice?.id ? latest : null;
    return { subscription, invoice, latestInvoice };
  }

  private async synchronizeSubscription(
    current: LemonSqueezySubscriptionData,
    payload: LemonSqueezyWebhookPayload,
    tx: TransactionClient,
    invoice: LemonSqueezyInvoiceData | null,
  ) {
    const local = await this.subscriptionsRepo.findByLemonSubscriptionId(current.id, tx);
    if (!local && payload.meta.event_name === 'subscription_created') {
      return this.attachSubscription(current, payload.meta.custom_data?.tenant_id, tx);
    }
    if (!local || local.deletedAt) {
      throw new NotFoundException('Subscription mapping not found; retry after activation.');
    }

    const resource = `subscriptions:${current.id}`;
    const target = this.plansService.resolvePlanByVariantId(String(current.attributes.variant_id));
    const upgradePaid = confirmsUpgradePayment(local, current, invoice);
    if (await this.providerSync.isNewer(resource, current.attributes.updated_at, tx)) {
      await this.subscriptionsRepo.updateByLemonSubscriptionId(
        current.id,
        projectProviderPlanChange(local, current, target, upgradePaid),
        tx,
      );
      await this.providerSync.markVersion(resource, current.attributes.updated_at, tx);
    } else if (
      upgradePaid &&
      local.pendingPlanId === target.planId &&
      local.pendingBillingCycle === target.cycle &&
      (await this.providerSync.matchesVersion(resource, current.attributes.updated_at, tx))
    ) {
      // Payment may arrive after lifecycle sync at the same subscription version.
      await this.subscriptionsRepo.updateByLemonSubscriptionId(
        current.id,
        {
          planId: target.planId,
          billingCycle: target.cycle,
          amount: target.price,
          pendingPlanId: null,
          pendingBillingCycle: null,
          planChangesAt: null,
        },
        tx,
      );
    }
    return local;
  }

  private async attachSubscription(current: LemonSqueezySubscriptionData, tenantId: unknown, tx: TransactionClient) {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new BadRequestException('Missing tenant_id in subscription metadata.');
    }
    const local = await this.subscriptionsRepo.findByTenantId(tenantId, tx);
    if (!local || local.deletedAt) {
      throw new NotFoundException('Subscription mapping not found.');
    }
    const canReplace = local.status === 'EXPIRED' || (local.status === 'CANCELLED' && local.endsAt && local.endsAt <= new Date());
    if (local.lemonSubscriptionId && local.lemonSubscriptionId !== current.id && !canReplace) {
      throw new ConflictException('Conflicting provider subscription.');
    }

    const attached = await this.subscriptionsRepo.attachProviderSubscription(
      tenantId,
      local.lemonSubscriptionId,
      {
        ...this.subscriptionUpdate(current),
        lemonSubscriptionId: current.id,
        currentPeriodStart: new Date(current.attributes.created_at),
      },
      tx,
    );
    if (attached.count !== 1) {
      throw new ConflictException('Subscription changed during activation.');
    }
    await this.providerSync.markVersion(`subscriptions:${current.id}`, current.attributes.updated_at, tx);
    return local;
  }

  private async synchronizeInvoice(invoice: LemonSqueezyInvoiceData, local: Subscription, failed: boolean, tx: TransactionClient) {
    const resource = `subscription-invoices:${invoice.id}`;
    if (!(await this.providerSync.isNewer(resource, invoice.attributes.updated_at, tx))) {
      return;
    }
    await this.paymentsService.synchronizeInvoice(invoice, { tenantId: local.tenantId, subscriptionId: local.id }, tx, failed);
    await this.providerSync.markVersion(resource, invoice.attributes.updated_at, tx);
  }

  private subscriptionUpdate(current: LemonSqueezySubscriptionData, cancelledAt?: Date | null) {
    const plan = this.plansService.resolvePlanByVariantId(String(current.attributes.variant_id));
    return toProviderSubscriptionUpdate(current, plan, cancelledAt);
  }

  private assertCaughtUp(current: string, event: string, resource: string) {
    if (Date.parse(current) < Date.parse(event)) {
      throw new InternalServerErrorException(`Provider ${resource} state has not caught up; retry delivery.`);
    }
  }

  private async recordFailure(requestId: string, resource: string) {
    this.logger.error(`Billing synchronization failed for ${resource}; provider delivery can retry.`);
    try {
      await this.providerSync.recordFailure(requestId, resource);
    } catch {
      this.logger.error('Unable to persist billing synchronization failure.');
    }
  }
}
