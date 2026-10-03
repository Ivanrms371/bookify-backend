import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ParseUUIDPipe, type ExecutionContext } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PermissionsGuard } from 'src/common/security/guards/permissions.guard';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { validationPipe } from 'src/config/configuration';
import { PaymentsController } from '../payments.controller';
import { PaymentsService } from '../payments.service';
import { PaymentsRepository } from '../payments.repository';
import { ListPaymentsDto } from '../dto/list-payments.dto';
import type { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import type { PrismaService } from 'src/shared/prisma/prisma.service';
import { isInvoiceUrl } from 'src/shared/integrations/lemon-squeezy/invoice-url';

const url = 'https://app.lemonsqueezy.com/my-orders/example/subscription-invoice/example?signature=test';
const row = {
  id: '0199abcd-1234-7123-8123-123456789012',
  referenceCode: 'PAY-2026-0051',
  issuedAt: new Date('2026-10-01T10:00:00Z'),
  transactionAmount: new Prisma.Decimal('18.99'),
  transactionCurrency: 'EUR',
  status: 'COMPLETED' as const,
  invoiceUrl: url,
};
function setup() {
  const repo = { list: jest.fn().mockResolvedValue({ rows: [row], total: 1 }), findForInvoice: jest.fn() };
  const provider = {
    retrieveInvoiceForDownload: jest.fn().mockResolvedValue({
      attributes: { subscription_id: 123, customer_id: 22, urls: { invoice_url: url } },
    }),
  };
  return {
    repo,
    provider,
    service: new PaymentsService(repo as unknown as PaymentsRepository, provider as unknown as LemonSqueezyService),
  };
}
const legacy = {
  invoiceUrl: null,
  externalId: '500',
  subscription: {
    tenantId: 'tenant-A',
    paymentProvider: 'LEMON_SQUEEZY',
    lemonSubscriptionId: '123',
    lemonCustomerId: '22',
  },
};

describe('payment history boundary', () => {
  it('validates defaults and query strings using the application pipe', async () => {
    expect(await validationPipe.transform({}, { type: 'query', metatype: ListPaymentsDto })).toEqual({ page: 1, pageSize: 10 });
    expect(await validationPipe.transform({ page: '2', pageSize: '100' }, { type: 'query', metatype: ListPaymentsDto })).toEqual({
      page: 2,
      pageSize: 100,
    });
  });
  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'abc' },
    { page: '1e2' },
    { page: ['1', '2'] },
    { page: '9007199254740992' },
    { pageSize: '0' },
    { pageSize: '101' },
    { pageSize: ['10'] },
    { tenantId: 'tenant-B' },
    { page: '' },
  ])('rejects invalid pagination or unsupported query %j', async (value) => {
    await expect(validationPipe.transform(value, { type: 'query', metatype: ListPaymentsDto })).rejects.toThrow();
  });
  it('rejects unsafe offsets before querying', async () => {
    const { service, repo } = setup();
    await expect(service.list('tenant-A', { page: Number.MAX_SAFE_INTEGER, pageSize: 100 })).rejects.toThrow();
    expect(repo.list).not.toHaveBeenCalled();
  });
  it.each(['list', 'getInvoice'] as const)('restricts %s to owners using the actual permission guard', (method) => {
    const guard = new PermissionsGuard(new Reflector());
    for (const role of ['OWNER', 'ADMIN', 'STAFF'] as const) {
      const context = {
        getHandler: () => PaymentsController.prototype[method],
        getClass: () => PaymentsController,
        switchToHttp: () => ({ getRequest: () => ({ tenantContext: { permissions: ROLE_PERMISSIONS[role] } }) }),
      } as unknown as ExecutionContext;
      if (role === 'OWNER') expect(guard.canActivate(context)).toBe(true);
      else expect(() => guard.canActivate(context)).toThrow();
    }
  });
  it('accepts UUID v7 and rejects malformed payment IDs', async () => {
    const pipe = new ParseUUIDPipe();
    await expect(pipe.transform(row.id, { type: 'param' })).resolves.toBe(row.id);
    await expect(pipe.transform('500', { type: 'param' })).rejects.toThrow();
  });
  it.each(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'])(
    'returns actual values and no internal fields for %s',
    async (status) => {
      const { repo, provider, service } = setup();
      repo.list.mockResolvedValue({ rows: [{ ...row, status, externalId: 'private', netReceivedAmount: 0 }], total: 21 });
      expect(await service.list('tenant-A', { page: 2, pageSize: 10 })).toEqual({
        items: [
          {
            id: row.id,
            referenceCode: row.referenceCode,
            date: row.issuedAt.toISOString(),
            amount: '18.99',
            currency: 'EUR',
            status,
            invoiceAvailable: true,
          },
        ],
        meta: { page: 2, pageSize: 10, total: 21 },
      });
      expect(repo.list).toHaveBeenCalledWith('tenant-A', 10, 10);
      expect(provider.retrieveInvoiceForDownload).not.toHaveBeenCalled();
    },
  );
  it('returns out-of-range/empty results without changing total', async () => {
    const { repo, service } = setup();
    repo.list.mockResolvedValue({ rows: [], total: 1 });
    expect(await service.list('tenant-A', { page: 3, pageSize: 10 })).toEqual({ items: [], meta: { page: 3, pageSize: 10, total: 1 } });
  });
  it('reports missing or unsafe stored invoice URLs as unavailable in history', async () => {
    const { repo, service } = setup();
    repo.list.mockResolvedValue({ rows: [{ ...row, invoiceUrl: null }], total: 1 });
    expect((await service.list('tenant-A', { page: 1, pageSize: 10 })).items[0].invoiceAvailable).toBe(false);
  });
});

describe('tenant invoice access', () => {
  it('returns a stored URL without a provider request, including historical mappings', async () => {
    const { repo, provider, service } = setup();
    repo.findForInvoice.mockResolvedValue({ invoiceUrl: url, subscription: null });
    expect(await service.getInvoice('tenant-A', row.id)).toEqual({ url });
    expect(repo.findForInvoice).toHaveBeenCalledWith('tenant-A', row.id);
    expect(provider.retrieveInvoiceForDownload).not.toHaveBeenCalled();
  });
  it('does not access the provider for missing, deleted or foreign-tenant scoped results', async () => {
    const { repo, provider, service } = setup();
    repo.findForInvoice.mockResolvedValue(null);
    await expect(service.getInvoice('tenant-B', row.id)).rejects.toMatchObject({ response: { code: 'PAYMENT_NOT_FOUND' } });
    expect(provider.retrieveInvoiceForDownload).not.toHaveBeenCalled();
  });
  it('verifies legacy association before returning a provider URL without writing', async () => {
    const { repo, provider, service } = setup();
    repo.findForInvoice.mockResolvedValue(legacy);
    expect(await service.getInvoice('tenant-A', row.id)).toEqual({ url });
    expect(provider.retrieveInvoiceForDownload).toHaveBeenCalledWith('500');
  });
  it.each([
    { ...legacy, subscription: null },
    { ...legacy, externalId: 'legacy-id' },
    { ...legacy, subscription: { ...legacy.subscription, tenantId: 'tenant-B' } },
    { ...legacy, subscription: { ...legacy.subscription, paymentProvider: 'MERCADOPAGO' } },
    { ...legacy, subscription: { ...legacy.subscription, lemonCustomerId: null } },
  ])('rejects unverifiable legacy association %j without provider calls', async (payment) => {
    const { repo, provider, service } = setup();
    repo.findForInvoice.mockResolvedValue(payment);
    await expect(service.getInvoice('tenant-A', row.id)).rejects.toMatchObject({ response: { code: 'INVOICE_UNAVAILABLE' } });
    expect(provider.retrieveInvoiceForDownload).not.toHaveBeenCalled();
  });
  it.each([
    { subscription_id: 999, customer_id: 22, urls: { invoice_url: url } },
    { subscription_id: 123, customer_id: 999, urls: { invoice_url: url } },
    { subscription_id: 123, customer_id: 22, urls: { invoice_url: null } },
  ])('does not disclose an unavailable or mismatched invoice %j', async (attributes) => {
    const { repo, provider, service } = setup();
    repo.findForInvoice.mockResolvedValue(legacy);
    provider.retrieveInvoiceForDownload.mockResolvedValue({ attributes });
    await expect(service.getInvoice('tenant-A', row.id)).rejects.toMatchObject({ response: { code: 'INVOICE_UNAVAILABLE' } });
  });
});

describe('payment repository scoping', () => {
  it('uses the same tenant and soft-delete predicate for stable rows and count in repeatable-read', async () => {
    const db = {
      payment: { findMany: jest.fn().mockReturnValue('rows'), count: jest.fn().mockReturnValue('count') },
      $transaction: jest.fn().mockResolvedValue([[], 7]),
    };
    const repo = new PaymentsRepository(db as unknown as PrismaService);
    expect(await repo.list('tenant-A', 10, 10)).toEqual({ rows: [], total: 7 });
    expect(db.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-A', deletedAt: null },
        skip: 10,
        take: 10,
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(db.payment.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-A', deletedAt: null } });
    expect(db.$transaction).toHaveBeenCalledWith(['rows', 'count'], { isolationLevel: 'RepeatableRead' });
  });
  it('scopes invoice lookup by local ID, tenant and soft deletion', async () => {
    const db = { payment: { findFirst: jest.fn() } };
    await new PaymentsRepository(db as unknown as PrismaService).findForInvoice('tenant-A', row.id);
    expect(db.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: row.id, tenantId: 'tenant-A', deletedAt: null } }),
    );
  });
});

describe('signed invoice URL validation', () => {
  it('accepts the provider HTTPS hostname', () => expect(isInvoiceUrl(url)).toBe(true));
  it.each([
    'http://app.lemonsqueezy.com/invoice',
    'https://app.lemonsqueezy.com.evil.test/invoice',
    'https://evil.test/app.lemonsqueezy.com',
    'https://user:password@app.lemonsqueezy.com/invoice',
    'javascript:alert(1)',
    'https://app.lemonsqueezy.com:444/invoice',
    '',
    null,
  ])('rejects unsafe URL %s', (value) => {
    expect(isInvoiceUrl(value)).toBe(false);
  });
});
