import { SubscriptionStatus } from 'src/generated/prisma/enums';
import { MercadoPagoPreapproval } from './types/preapproval-subscription.type';
import { Decimal } from '@prisma/client/runtime/client';
import { SubscriptionUpdateInput } from 'src/generated/prisma/models';

export function mapMercadoPagoStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'authorized':
      return SubscriptionStatus.ACTIVE;

    case 'pending':
      return SubscriptionStatus.PENDING_PAYMENT;

    case 'paused':
      return SubscriptionStatus.SUSPENDED;

    case 'cancelled':
      return SubscriptionStatus.CANCELLED;

    default:
      return SubscriptionStatus.PENDING_PAYMENT;
  }
}

export function mapMercadoPagoPreapprovalToSubscription(
  mp: MercadoPagoPreapproval,
): SubscriptionUpdateInput {
  return {
    externalId: mp.id,
    status: mapMercadoPagoStatus(mp.status),

    paymentProvider: 'MERCADOPAGO',
    paymentMethod: mp.payment_method_id,

    amount: new Decimal(mp.auto_recurring.transaction_amount),
    currency: mp.auto_recurring.currency_id,

    currentPeriodStart: mp.auto_recurring.start_date
      ? new Date(mp.auto_recurring.start_date)
      : null,

    currentPeriodEnd: mp.auto_recurring.end_date ? new Date(mp.auto_recurring.end_date) : null,

    nextPaymentDate: mp.next_payment_date ? new Date(mp.next_payment_date) : null,

    billingCycle: 'MONTHLY',
  };
}
