import { ConflictException, Injectable } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { Prisma } from 'src/generated/prisma/client';
import { PaymentStatus } from 'src/generated/prisma/enums';
import type { LemonSqueezyInvoiceData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  // Internal provider ingestion only. The coordinator holds the billing write lock.
  async synchronizeInvoice(invoice: LemonSqueezyInvoiceData, association: { tenantId: string; subscriptionId: string }, tx: Prisma.TransactionClient, failed = false) {
    const existing = await this.paymentsRepository.findByExternalId(invoice.id, tx);
    if (existing && (existing.tenantId !== association.tenantId || existing.subscriptionId !== association.subscriptionId)) {
      throw new ConflictException('Invoice belongs to another subscription.');
    }
    const attrs = invoice.attributes;
    const statuses: Record<typeof attrs.status, PaymentStatus> = {
      pending: 'PENDING', paid: 'COMPLETED', void: 'CANCELLED', refunded: 'REFUNDED', partial_refund: 'REFUNDED',
    };
    const data = {
      ...association, externalId: invoice.id, status: attrs.status === 'pending' && failed ? PaymentStatus.FAILED : statuses[attrs.status],
      transactionAmount: new Prisma.Decimal(attrs.total).div(100), transactionCurrency: attrs.currency,
      // The invoice API does not expose merchant net proceeds. Required legacy field
      // uses zero with explicit metadata; never infer proceeds from catalog prices.
      netReceivedAmount: new Prisma.Decimal(0),
      statusDetails: JSON.stringify({ providerStatus: attrs.status, refundedAmount: new Prisma.Decimal(attrs.refunded_amount).div(100).toFixed(2), netReceivedAmountAvailable: false }),
      issuedAt: new Date(attrs.created_at),
    };
    if (existing) return this.paymentsRepository.updateByExternalId(invoice.id, data, tx);
    const last = await this.paymentsRepository.findLast(tx);
    const sequenceNumber = (last?.sequenceNumber ?? 50) + 1;
    return this.paymentsRepository.create({ ...data,
      referenceCode: `PAY-${new Date(attrs.created_at).getUTCFullYear()}-${sequenceNumber.toString().padStart(4, '0')}`,
      sequenceNumber,
    }, tx);
  }
}
