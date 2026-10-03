import axios from 'axios';
import * as crypto from 'crypto';
import { LemonSqueezyService } from './lemon-squeezy.service';

describe('checkout provider boundary', () => {
  const keys = ['LEMON_SQUEEZY_API_KEY', 'LEMON_SQUEEZY_STORE_ID', 'LEMON_SQUEEZY_WEBHOOK_SECRET', 'LEMON_SQUEEZY_TEST_MODE'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  let service: LemonSqueezyService;
  let post: jest.Mock;
  let get: jest.Mock;
  beforeEach(() => {
    process.env.LEMON_SQUEEZY_API_KEY = 'unit-test-key';
    process.env.LEMON_SQUEEZY_STORE_ID = '99';
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = 'unit-test-secret';
    process.env.LEMON_SQUEEZY_TEST_MODE = 'true';
    post = jest.fn().mockResolvedValue({ data: { data: { attributes: { url: 'https://store.lemonsqueezy.com/checkout/test' } } } });
    get = jest.fn();
    jest.spyOn(axios, 'create').mockReturnValue({ post, get } as unknown as ReturnType<typeof axios.create>);
    service = new LemonSqueezyService();
  });
  afterEach(() => { jest.restoreAllMocks(); for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } });
  it('restricts checkout to the validated variant, skips repeat trials and uses trusted return URL/test mode', async () => {
    await service.createCheckout({ variantId: '123', tenantId: 'tenant', userEmail: 'owner@example.com', redirectUrl: 'https://app.example.com/workspace/billing/return' });
    expect(post).toHaveBeenCalledWith('/checkouts', expect.objectContaining({ data: expect.objectContaining({ attributes: expect.objectContaining({ product_options: { enabled_variants: [123], redirect_url: 'https://app.example.com/workspace/billing/return' }, checkout_options: { skip_trial: true }, test_mode: true, checkout_data: expect.objectContaining({ custom: { tenant_id: 'tenant' } }) }) }) }));
  });
  it('rejects invalid variants before any HTTP call', async () => {
    await expect(service.createCheckout({ variantId: '123-other', tenantId: 'tenant', userEmail: 'owner@example.com' })).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
  const payload = () => ({ meta: { event_name: 'subscription_created', test_mode: true }, data: { type: 'subscriptions', id: '123', attributes: { store_id: 99, test_mode: true, variant_id: 123, customer_id: 22, status: 'active', created_at: '2026-10-02T12:00:00Z', updated_at: '2026-10-02T12:00:00Z', trial_ends_at: null, renews_at: null, ends_at: null } } });
  const sign = (body: Buffer) => crypto.createHmac('sha256', 'unit-test-secret').update(body).digest('hex');
  it('accepts an authentic expected-store/test-mode subscription event', () => {
    const body = Buffer.from(JSON.stringify(payload()));
    expect(service.verifyWebhookSignature(body, sign(body)).data.id).toBe('123');
  });
  it('rejects a forged signature', () => {
    const body = Buffer.from(JSON.stringify(payload()));
    expect(() => service.verifyWebhookSignature(body, '0'.repeat(64))).toThrow('Invalid webhook signature');
  });
  it('rejects a valid signature from the wrong store or mode', () => {
    const otherStore = payload(); otherStore.data.attributes.store_id = 98;
    const body = Buffer.from(JSON.stringify(otherStore));
    expect(() => service.verifyWebhookSignature(body, sign(body))).toThrow('store/mode mismatch');
    const live = payload(); live.meta.test_mode = false;
    const liveBody = Buffer.from(JSON.stringify(live));
    expect(() => service.verifyWebhookSignature(liveBody, sign(liveBody))).toThrow('store/mode mismatch');
  });
  it('rejects unknown status, malformed JSON and invalid dates', () => {
    const invalid = payload(); invalid.data.attributes.status = 'surprise';
    const body = Buffer.from(JSON.stringify(invalid));
    expect(() => service.verifyWebhookSignature(body, sign(body))).toThrow('Invalid subscription attributes');
    const malformed = Buffer.from('{');
    expect(() => service.verifyWebhookSignature(malformed, sign(malformed))).toThrow('Invalid webhook JSON');
    const invalidDate = payload(); invalidDate.data.attributes.created_at = 'oops';
    const dateBody = Buffer.from(JSON.stringify(invalidDate));
    expect(() => service.verifyWebhookSignature(dateBody, sign(dateBody))).toThrow('Invalid provider date');
  });
  const invoicePayload = () => ({ meta: { event_name: 'subscription_payment_success', test_mode: true }, data: {
    type: 'subscription-invoices', id: '500', attributes: { store_id: 99, test_mode: true, subscription_id: 123, customer_id: 22,
      status: 'paid', currency: 'USD', total: 1499, refunded_amount: 0, created_at: '2026-10-02T12:00:00Z', updated_at: '2026-10-02T12:00:00Z' },
  } });
  it('accepts signed invoice events with correct shape', () => {
    const body = Buffer.from(JSON.stringify(invoicePayload()));
    expect(service.verifyWebhookSignature(body, sign(body)).data.type).toBe('subscription-invoices');
  });
  it.each(['total', 'refunded_amount', 'subscription_id'])('rejects malformed invoice %s', (field) => {
    const invoice = invoicePayload(); Object.assign(invoice.data.attributes, { [field]: -1 });
    const body = Buffer.from(JSON.stringify(invoice));
    expect(() => service.verifyWebhookSignature(body, sign(body))).toThrow();
  });
  it('rejects invoice events containing subscription objects', () => {
    const invalid = payload(); invalid.meta.event_name = 'subscription_payment_failed';
    const body = Buffer.from(JSON.stringify(invalid));
    expect(() => service.verifyWebhookSignature(body, sign(body))).toThrow('Invoice event requires invoice data');
  });
  it('retrieves and validates authoritative invoice/subscription resources', async () => {
    get.mockResolvedValueOnce({ data: { data: invoicePayload().data } }).mockResolvedValueOnce({ data: { data: payload().data } });
    expect((await service.retrieveInvoice('500')).id).toBe('500');
    expect((await service.retrieveSubscription('123')).id).toBe('123');
    expect(get.mock.calls.map(([url]) => url)).toEqual(['/subscription-invoices/500', '/subscriptions/123']);
  });
  it('rejects mismatched resource ID, store and unknown provider status from HTTP', async () => {
    get.mockResolvedValueOnce({ data: { data: { ...invoicePayload().data, id: '999' } } });
    await expect(service.retrieveInvoice('500')).rejects.toThrow('Unable to synchronize');
    const wrongStore = invoicePayload().data; wrongStore.attributes.store_id = 98;
    get.mockResolvedValueOnce({ data: { data: wrongStore } });
    await expect(service.retrieveInvoice('500')).rejects.toThrow('Unable to synchronize');
    const unknown = payload().data; unknown.attributes.status = 'unknown';
    get.mockResolvedValueOnce({ data: { data: unknown } });
    await expect(service.retrieveSubscription('123')).rejects.toThrow('Unable to synchronize');
  });

});
