import type { InvoicePayment, InvoiceProviderAssociation, PaymentAssociation } from './types/payment-invoice.types';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { isInvoiceUrl } from 'src/shared/integrations/lemon-squeezy/invoice-url';
import type { ListPaymentsDto } from './dto/list-payments.dto';
import type { PaymentDto } from './dto/payment.dto';
import { Injectable } from '@nestjs/common';
import {
  InvalidPaymentPaginationException,
  PaymentNotFoundException,
  InvoiceUnavailableException,
  InvalidInvoiceProviderResponseException,
  InvoiceAssociationConflictException,
  InvalidProviderInvoiceUrlException,
} from './exceptions/payment.exceptions';
import { PaymentsRepository } from './payments.repository';
import { Prisma } from 'src/generated/prisma/client';
import { PaymentStatus } from 'src/generated/prisma/enums';
import type { LemonSqueezyInvoiceData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly provider: LemonSqueezyService,
  ) {}

  async list(tenantId: string, { page, pageSize }: ListPaymentsDto) {
    const skip = (page - 1) * pageSize;
    if (!Number.isSafeInteger(skip) || !Number.isSafeInteger(skip + pageSize)) throw new InvalidPaymentPaginationException();
    const { rows, total } = await this.paymentsRepository.list(tenantId, skip, pageSize);
    const items: PaymentDto[] = rows.map((row) => ({
      id: row.id,
      referenceCode: row.referenceCode,
      date: row.issuedAt.toISOString(),
      amount: row.transactionAmount.toFixed(2),
      currency: row.transactionCurrency,
      status: row.status,
      invoiceAvailable: isInvoiceUrl(row.invoiceUrl),
    }));
    return { items, meta: { page, pageSize, total } };
  }

  async getInvoice(tenantId: string, paymentId: string) {
    const payment = await this.paymentsRepository.findForInvoice(tenantId, paymentId);
    if (!payment) throw new PaymentNotFoundException();
    if (isInvoiceUrl(payment.invoiceUrl)) return { url: payment.invoiceUrl };

    return this.fetchLegacyInvoice(tenantId, payment);
  }

  // Older payments may not have a stored download link. Verify ownership before fetching one.
  private async fetchLegacyInvoice(tenantId: string, payment: InvoicePayment) {
    const association = this.requireInvoiceProviderAssociation(tenantId, payment);
    const invoice = await this.provider.retrieveInvoiceForDownload(payment.externalId);
    this.verifyInvoiceOwnership(invoice, association);
    return { url: this.requireInvoiceDownloadUrl(invoice) };
  }

  private requireInvoiceProviderAssociation(tenantId: string, payment: InvoicePayment): InvoiceProviderAssociation {
    const subscription = payment.subscription;
    if (!subscription || subscription.tenantId !== tenantId) {
      throw new InvoiceUnavailableException();
    }
    if (subscription.paymentProvider !== 'LEMON_SQUEEZY') {
      throw new InvoiceUnavailableException();
    }
    if (!subscription.lemonSubscriptionId || !subscription.lemonCustomerId) {
      throw new InvoiceUnavailableException();
    }
    const hasNumericProviderInvoiceId = /^[0-9]+$/.test(payment.externalId);
    if (!hasNumericProviderInvoiceId) {
      throw new InvoiceUnavailableException();
    }
    return { subscriptionId: subscription.lemonSubscriptionId, customerId: subscription.lemonCustomerId };
  }

  private verifyInvoiceOwnership(invoice: LemonSqueezyInvoiceData, association: InvoiceProviderAssociation): void {
    const matchesSubscription = String(invoice.attributes.subscription_id) === association.subscriptionId;
    const matchesCustomer = String(invoice.attributes.customer_id) === association.customerId;
    if (!matchesSubscription || !matchesCustomer) {
      throw new InvoiceUnavailableException();
    }
  }

  private requireInvoiceDownloadUrl(invoice: LemonSqueezyInvoiceData): string {
    const url = invoice.attributes.urls?.invoice_url;
    if (!url) throw new InvoiceUnavailableException();
    if (!isInvoiceUrl(url)) throw new InvalidInvoiceProviderResponseException();
    return url;
  }

  // Internal provider ingestion only. The coordinator holds the billing write lock.
  async synchronizeInvoice(
    invoice: LemonSqueezyInvoiceData,
    association: PaymentAssociation,
    tx: Prisma.TransactionClient,
    failed = false,
  ) {
    const existing = await this.paymentsRepository.findByExternalId(invoice.id, tx);
    if (existing && (existing.tenantId !== association.tenantId || existing.subscriptionId !== association.subscriptionId)) {
      throw new InvoiceAssociationConflictException();
    }
    const attrs = invoice.attributes;
    const statuses: Record<typeof attrs.status, PaymentStatus> = {
      pending: 'PENDING',
      paid: 'COMPLETED',
      void: 'CANCELLED',
      refunded: 'REFUNDED',
      partial_refund: 'REFUNDED',
    };
    const invoiceUrl = attrs.urls?.invoice_url;
    if (invoiceUrl !== undefined && invoiceUrl !== null && !isInvoiceUrl(invoiceUrl)) throw new InvalidProviderInvoiceUrlException();
    const data = {
      ...(invoiceUrl !== undefined ? { invoiceUrl } : {}),
      ...association,
      externalId: invoice.id,
      status: attrs.status === 'pending' && failed ? PaymentStatus.FAILED : statuses[attrs.status],
      transactionAmount: new Prisma.Decimal(attrs.total).div(100),
      transactionCurrency: attrs.currency,
      // The invoice API does not expose merchant net proceeds. Required legacy field
      // uses zero with explicit metadata; never infer proceeds from catalog prices.
      netReceivedAmount: new Prisma.Decimal(0),
      statusDetails: JSON.stringify({
        providerStatus: attrs.status,
        refundedAmount: new Prisma.Decimal(attrs.refunded_amount).div(100).toFixed(2),
        netReceivedAmountAvailable: false,
      }),
      issuedAt: new Date(attrs.created_at),
    };
    if (existing) return this.paymentsRepository.updateByExternalId(invoice.id, data, tx);
    const last = await this.paymentsRepository.findLast(tx);
    const sequenceNumber = (last?.sequenceNumber ?? 50) + 1;
    return this.paymentsRepository.create(
      {
        ...data,
        referenceCode: `PAY-${new Date(attrs.created_at).getUTCFullYear()}-${sequenceNumber.toString().padStart(4, '0')}`,
        sequenceNumber,
      },
      tx,
    );
  }
}
