import { PaymentsService } from '../payments.service';
import type { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import type { PaymentsRepository } from '../payments.repository';
import type { Prisma } from 'src/generated/prisma/client';
import type { LemonSqueezyInvoiceData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';

const invoice = (status: LemonSqueezyInvoiceData['attributes']['status'] = 'paid'): LemonSqueezyInvoiceData => ({
  id: '500',
  type: 'subscription-invoices',
  attributes: {
    store_id: 99,
    customer_id: 22,
    subscription_id: 123,
    test_mode: true,
    status,
    currency: 'EUR',
    total: 1899,
    refunded_amount: status === 'partial_refund' ? 400 : status === 'refunded' ? 1899 : 0,
    created_at: '2026-10-02T12:00:00Z',
    updated_at: '2026-10-02T12:00:00Z',
  },
});
function setup(existing: unknown = null) {
  const repo = {
    findByExternalId: jest.fn().mockResolvedValue(existing),
    findLast: jest.fn().mockResolvedValue({ sequenceNumber: 75 }),
    create: jest.fn(),
    updateByExternalId: jest.fn(),
  };
  return {
    repo,
    service: new PaymentsService(repo as unknown as PaymentsRepository, {} as LemonSqueezyService),
    tx: {} as Prisma.TransactionClient,
  };
}
const association = { tenantId: 'tenant-A', subscriptionId: 'sub-A' };

describe('provider invoice persistence', () => {
  it('uses invoice totals/currency and allocates from numeric sequence without DTO-only fields', async () => {
    const { service, repo, tx } = setup();
    await service.synchronizeInvoice(invoice(), association, tx);
    const [data, client] = repo.create.mock.calls[0];
    expect(data.transactionAmount.toFixed(2)).toBe('18.99');
    expect(data.transactionCurrency).toBe('EUR');
    expect(data).toMatchObject({
      externalId: '500',
      status: 'COMPLETED',
      sequenceNumber: 76,
      referenceCode: 'PAY-2026-0076',
      ...association,
    });
    expect(data.netReceivedAmount.toFixed(2)).toBe('0.00');
    expect(JSON.parse(data.statusDetails).netReceivedAmountAvailable).toBe(false);
    expect(data).not.toHaveProperty('invoiceUrl');
    expect(data).not.toHaveProperty('currency');
    expect(client).toBe(tx);
    expect(repo.findLast).toHaveBeenCalledWith(tx);
  });
  it('updates retries on the same external invoice without allocating another reference', async () => {
    const { service, repo, tx } = setup(association);
    await service.synchronizeInvoice(invoice(), association, tx);
    expect(repo.updateByExternalId).toHaveBeenCalledWith('500', expect.objectContaining({ status: 'COMPLETED' }), tx);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.findLast).not.toHaveBeenCalled();
  });
  it('rejects cross-tenant/subscription reassignment', async () => {
    const { service, repo, tx } = setup({ ...association, tenantId: 'tenant-B' });
    await expect(service.synchronizeInvoice(invoice(), association, tx)).rejects.toThrow('another subscription');
    expect(repo.updateByExternalId).not.toHaveBeenCalled();
  });
  it.each([
    ['pending', false, 'PENDING'],
    ['pending', true, 'FAILED'],
    ['paid', true, 'COMPLETED'],
    ['void', false, 'CANCELLED'],
    ['refunded', false, 'REFUNDED'],
    ['partial_refund', false, 'REFUNDED'],
  ] as const)('maps %s (failure event %s) to %s', async (status, failed, expected) => {
    const { service, repo, tx } = setup();
    await service.synchronizeInvoice(invoice(status), association, tx, failed);
    expect(repo.create.mock.calls[0][0].status).toBe(expected);
  });
  it('preserves partial refund amount separately from the original charged total', async () => {
    const { service, repo, tx } = setup();
    await service.synchronizeInvoice(invoice('partial_refund'), association, tx);
    const data = repo.create.mock.calls[0][0];
    expect(data.transactionAmount.toFixed(2)).toBe('18.99');
    expect(JSON.parse(data.statusDetails)).toMatchObject({ providerStatus: 'partial_refund', refundedAmount: '4.00' });
  });
  it('persists the validated invoice URL in the supplied transaction', async () => {
    const { service, repo, tx } = setup();
    const data = invoice();
    data.attributes.urls = { invoice_url: 'https://app.lemonsqueezy.com/my-orders/test/invoice?signature=test' };
    await service.synchronizeInvoice(data, association, tx);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ invoiceUrl: data.attributes.urls.invoice_url }), tx);
  });
  it('preserves a stored URL when updates omit it and clears it on explicit null', async () => {
    const { service, repo, tx } = setup({ ...association, invoiceUrl: 'https://app.lemonsqueezy.com/invoice' });
    await service.synchronizeInvoice(invoice(), association, tx);
    expect(repo.updateByExternalId.mock.calls[0][1]).not.toHaveProperty('invoiceUrl');
    const data = invoice('pending');
    data.attributes.urls = { invoice_url: null };
    await service.synchronizeInvoice(data, association, tx);
    expect(repo.updateByExternalId.mock.calls[1][1]).toHaveProperty('invoiceUrl', null);
  });
  it('rejects unsafe URLs before persistence', async () => {
    const { service, repo, tx } = setup();
    const data = invoice();
    data.attributes.urls = { invoice_url: 'https://evil.test/invoice' };
    await expect(service.synchronizeInvoice(data, association, tx)).rejects.toThrow('Invalid provider invoice URL');
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.updateByExternalId).not.toHaveBeenCalled();
  });
});
