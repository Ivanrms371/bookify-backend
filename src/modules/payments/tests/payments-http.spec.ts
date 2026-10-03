import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentsModule } from '../payments.module';
import { PaymentsRepository } from '../payments.repository';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { PermissionsGuard } from 'src/common/security/guards/permissions.guard';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { validationPipe } from 'src/config/configuration';

// Only the payments module runs. Auth/tenant context is simulated, with the real permission guard.
describe('payment HTTP contract', () => {
  let app: INestApplication;
  const id = '0199abcd-1234-7123-8123-123456789012';
  const repo = { list: jest.fn(), findForInvoice: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [PaymentsModule] })
      .overrideProvider(PaymentsRepository)
      .useValue(repo)
      .overrideProvider(LemonSqueezyService)
      .useValue({ retrieveInvoiceForDownload: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use((req, _res, next) => {
      const role = req.headers['x-test-role'] || 'OWNER';
      req.tenantContext = { tenantId: req.headers['x-test-tenant'] || 'tenant-A', permissions: ROLE_PERMISSIONS[role] };
      next();
    });
    app.useGlobalPipes(validationPipe);
    app.useGlobalGuards(new PermissionsGuard(new Reflector()));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    repo.list.mockResolvedValue({ rows: [], total: 0 });
    repo.findForInvoice.mockImplementation(async (tenantId) =>
      tenantId === 'tenant-A' ? { invoiceUrl: 'https://app.lemonsqueezy.com/invoice?signature=test' } : null,
    );
  });
  afterAll(async () => {
    await app.close();
  });
  it('registers both endpoints and returns no-store headers', async () => {
    const list = await request(app.getHttpServer()).get('/api/payments?page=2&pageSize=5').expect(200);
    expect(list.headers['cache-control']).toBe('private, no-store');
    expect(list.body).toEqual({ items: [], meta: { page: 2, pageSize: 5, total: 0 } });
    expect(repo.list).toHaveBeenCalledWith('tenant-A', 5, 5);
    const invoice = await request(app.getHttpServer()).get(`/api/payments/${id}/invoice`).expect(200);
    expect(invoice.headers['cache-control']).toBe('private, no-store');
    expect(invoice.body).toEqual({ url: 'https://app.lemonsqueezy.com/invoice?signature=test' });
  });
  it.each(['ADMIN', 'STAFF'])('denies %s before data access', async (role) => {
    await request(app.getHttpServer()).get('/api/payments').set('x-test-role', role).expect(403);
    await request(app.getHttpServer()).get(`/api/payments/${id}/invoice`).set('x-test-role', role).expect(403);
    expect(repo.list).not.toHaveBeenCalled();
    expect(repo.findForInvoice).not.toHaveBeenCalled();
  });
  it('hides foreign-tenant payments', async () => {
    const result = await request(app.getHttpServer()).get(`/api/payments/${id}/invoice`).set('x-test-tenant', 'tenant-B').expect(404);
    expect(result.body.code).toBe('PAYMENT_NOT_FOUND');
    expect(repo.findForInvoice).toHaveBeenCalledWith('tenant-B', id);
  });
  it.each(['page=1.5', 'page=1&page=2', 'pageSize=101', 'tenantId=tenant-B'])(
    'rejects malformed or unsupported query %s',
    async (query) => {
      await request(app.getHttpServer()).get(`/api/payments?${query}`).expect(400);
      expect(repo.list).not.toHaveBeenCalled();
    },
  );
  it('rejects invalid IDs and exposes no payment write endpoint', async () => {
    await request(app.getHttpServer()).get('/api/payments/500/invoice').expect(400);
    await request(app.getHttpServer()).post('/api/payments').send({}).expect(404);
    expect(repo.findForInvoice).not.toHaveBeenCalled();
  });
});
