import type { PaymentsRepository } from '../payments.repository';

export type InvoicePayment = NonNullable<Awaited<ReturnType<PaymentsRepository['findForInvoice']>>>;
export interface InvoiceProviderAssociation {
  subscriptionId: string;
  customerId: string;
}

export interface PaymentAssociation {
  tenantId: string;
  subscriptionId: string;
}
