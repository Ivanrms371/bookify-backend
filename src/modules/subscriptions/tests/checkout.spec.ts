import type { PrismaService } from 'src/shared/prisma/prisma.service';
import { SubscriptionWebhookService } from '../subscription-webhook.service';
import type { PaymentsService } from '../../payments/payments.service';
import type { ProviderSyncRepository } from 'src/common/webhooks/repositories/provider-sync.repository';
import { SubscriptionsService } from '../subscriptions.service';
import { PlansService } from '../plans.service';
import { PLANS } from '../plans.config';
import type { SubscriptionsRepository } from '../subscriptions.repository';
import type { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { validate } from 'class-validator';
import { CheckoutSelectionDto } from '../dto/checkout.dto';

const setup = (overrides = {}) => {
  const record = {
    status: 'TRIAL',
    planId: 'pro_plus',
    trialEndsAt: new Date('2020-01-01'),
    deletedAt: null,
    lemonSubscriptionId: null,
    ...overrides,
  };
  const repo = {
    getCheckoutTenant: jest.fn().mockResolvedValue({ slug: 'my workspace', workspaceType: 'INDIVIDUAL', deletedAt: null }),
    findByTenantId: jest.fn().mockResolvedValue(record),
    getResourceUsage: jest.fn().mockResolvedValue({ professionals: 1, services: 1 }),
    attachProviderSubscription: jest.fn().mockResolvedValue({ count: 1 }),
  };
  const sync = {
    acquireLock: jest.fn(),
    transaction: jest.fn(async (work) => work({})),
    isNewer: jest.fn().mockResolvedValue(false),
    markVersion: jest.fn(),
    resolveFailure: jest.fn(),
    recordFailure: jest.fn(),
  };
  const provider = {
    retrieveSubscription: jest.fn(),
    retrieveInvoice: jest.fn(),
    createCheckout: jest.fn().mockResolvedValue('https://test.lemonsqueezy.com/checkout/buy/abc'),
    verifyWebhookSignature: jest.fn(),
  };
  Object.assign(repo, {
    findByLemonSubscriptionId: jest.fn().mockImplementation(async () => (record.lemonSubscriptionId === 'provider-1' ? record : null)),
  });
  provider.retrieveSubscription.mockImplementation(async () => provider.verifyWebhookSignature.mock.results.at(-1)?.value.data);
  return {
    repo,
    provider,
    webhook: new SubscriptionWebhookService(
      { $transaction: sync.transaction } as unknown as PrismaService,
      repo as unknown as SubscriptionsRepository,
      new PlansService(),
      provider as unknown as LemonSqueezyService,
      {} as PaymentsService,
      sync as unknown as ProviderSyncRepository,
    ),
    service: new SubscriptionsService(
      repo as unknown as SubscriptionsRepository,
      new PlansService(),
      provider as unknown as LemonSqueezyService,
    ),
  };
};

describe('checkout selection and activation', () => {
  const originalVariant = PLANS.pro.pricing.MONTHLY.lemonVariantId;
  const originalUrl = process.env.APP_URL;
  beforeEach(() => {
    PLANS.pro.pricing.MONTHLY.lemonVariantId = '123';
    process.env.APP_URL = 'https://app.example.com';
  });
  afterEach(() => {
    PLANS.pro.pricing.MONTHLY.lemonVariantId = originalVariant;
    if (originalUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalUrl;
  });

  it('rejects invalid plan and cycle DTOs', async () => {
    const dto = Object.assign(new CheckoutSelectionDto(), { planId: '__proto__', cycle: 'WEEKLY' });
    expect(await validate(dto)).toHaveLength(2);
  });
  it('builds a trusted tenant return URL and passes only the selected variant', async () => {
    const { service, provider, repo } = setup();
    await service.createCheckoutSession('tenant-1', 'owner@example.com', 'Owner', 'pro', 'MONTHLY');
    expect(provider.createCheckout).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userEmail: 'owner@example.com',
      userName: 'Owner',
      variantId: '123',
      redirectUrl: 'https://app.example.com/my%20workspace/billing/return?plan=pro&cycle=MONTHLY',
    });
    expect(repo.getResourceUsage).toHaveBeenCalledWith('tenant-1');
    expect(repo.getCheckoutTenant).toHaveBeenCalledWith('tenant-1');
  });
  it('blocks excess professionals and revalidates on POST without provider changes', async () => {
    const { service, repo, provider } = setup();
    expect((await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).eligible).toBe(true);
    repo.getResourceUsage.mockResolvedValue({ professionals: 4, services: 0 });
    expect(await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).toMatchObject({
      eligible: false,
      blockers: [expect.objectContaining({ resource: 'professionals', used: 4, limit: 3, excess: 1 })],
    });
    await expect(service.createCheckoutSession('tenant', 'owner@example.com', 'Owner', 'pro', 'MONTHLY')).rejects.toThrow();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });
  it.each(['ACTIVE', 'PAST_DUE', 'PAUSED', 'SUSPENDED', 'PENDING_PAYMENT', 'CANCELLED'])(
    'prevents duplicate checkout for %s provider subscriptions',
    async (status) => {
      const { service, provider } = setup({ status, planId: 'pro', lemonSubscriptionId: 'provider-1', endsAt: new Date('2099-01-01') });
      await expect(service.createCheckoutSession('tenant', 'owner@example.com', 'Owner', 'pro', 'MONTHLY')).rejects.toThrow();
      expect(provider.createCheckout).not.toHaveBeenCalled();
    },
  );
  it('allows immediate paid checkout during a running local trial', async () => {
    const { service, provider } = setup({ trialEndsAt: new Date('2099-01-01') });
    expect(await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).toMatchObject({
      eligible: true,
      blockers: [],
    });
    await expect(service.createCheckoutSession('tenant', 'owner@example.com', 'Owner', 'pro', 'MONTHLY')).resolves.toBe(
      'https://test.lemonsqueezy.com/checkout/buy/abc',
    );
    expect(provider.createCheckout).toHaveBeenCalledWith(expect.objectContaining({ variantId: '123', tenantId: 'tenant' }));
  });
  it('blocks missing subscriptions and never issues another trial', async () => {
    const { service, repo } = setup();
    repo.findByTenantId.mockResolvedValue(null as never);
    expect(await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).toMatchObject({
      eligible: false,
      blockers: [expect.objectContaining({ code: 'SUBSCRIPTION_REQUIRED' })],
    });
  });
  it('allows paid plans in team workspaces but blocks missing variants and Free checkout', async () => {
    const { service, repo, provider } = setup();
    repo.getCheckoutTenant.mockResolvedValue({ slug: 'team', workspaceType: 'TEAM', deletedAt: null });
    expect((await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).eligible).toBe(true);
    PLANS.pro.pricing.MONTHLY.lemonVariantId = '';
    expect((await service.getCheckoutEligibility('tenant', 'pro', 'MONTHLY')).blockers).toContainEqual(
      expect.objectContaining({ resource: 'provider' }),
    );
    await expect(service.createCheckoutSession('tenant', 'owner@example.com', 'Owner', 'free', 'MONTHLY')).rejects.toThrow();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });
  it('fails before calling the provider when the app URL is missing', async () => {
    delete process.env.APP_URL;
    const { service, provider } = setup();
    await expect(service.createCheckoutSession('tenant', 'owner@example.com', 'Owner', 'pro', 'MONTHLY')).rejects.toThrow();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });
  const created = {
    meta: { event_name: 'subscription_created', custom_data: { tenant_id: 'tenant' } },
    data: {
      id: 'provider-1',
      type: 'subscriptions',
      attributes: {
        variant_id: 123,
        customer_id: 22,
        status: 'active',
        created_at: '2026-10-02T12:00:00Z',
        updated_at: '2026-10-02T12:00:00Z',
        renews_at: '2026-11-02T12:00:00Z',
        ends_at: null,
        trial_ends_at: null,
      },
    },
  };
  it('attaches activation conditionally and clears the old trial end', async () => {
    const { webhook, repo, provider } = setup();
    provider.verifyWebhookSignature.mockReturnValue(created);
    await webhook.handleWebhook(Buffer.from('{}'), 'signed');
    expect(repo.attachProviderSubscription).toHaveBeenCalledWith(
      'tenant',
      null,
      expect.objectContaining({
        lemonSubscriptionId: 'provider-1',
        planId: 'pro',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        trialEndsAt: null,
      }),
      expect.anything(),
    );
  });
  it('rejects a tenant ID with no local subscription, rather than guessing another tenant', async () => {
    const { webhook, repo, provider } = setup();
    provider.verifyWebhookSignature.mockReturnValue(created);
    repo.findByTenantId.mockResolvedValue(null as never);
    await expect(webhook.handleWebhook(Buffer.from('{}'), 'signed')).rejects.toThrow('Subscription mapping not found.');
    expect(repo.findByTenantId).toHaveBeenCalledWith('tenant', expect.anything());
    expect(repo.attachProviderSubscription).not.toHaveBeenCalled();
  });
  it('rejects a deleted local subscription during activation', async () => {
    const { webhook, repo, provider } = setup({ deletedAt: new Date() });
    provider.verifyWebhookSignature.mockReturnValue(created);
    await expect(webhook.handleWebhook(Buffer.from('{}'), 'signed')).rejects.toThrow('Subscription mapping not found.');
    expect(repo.attachProviderSubscription).not.toHaveBeenCalled();
  });
  it('does not replay subscription_created over a later cancellation', async () => {
    const { webhook, repo, provider } = setup({ status: 'CANCELLED', lemonSubscriptionId: 'provider-1' });
    provider.verifyWebhookSignature.mockReturnValue(created);
    await webhook.handleWebhook(Buffer.from('{}'), 'signed');
    expect(repo.attachProviderSubscription).not.toHaveBeenCalled();
  });
  it('rejects a competing provider activation', async () => {
    const { webhook, repo, provider } = setup();
    provider.verifyWebhookSignature.mockReturnValue(created);
    repo.attachProviderSubscription.mockResolvedValue({ count: 0 });
    await expect(webhook.handleWebhook(Buffer.from('{}'), 'signed')).rejects.toThrow('Subscription changed');
  });
  it('rejects replacement of a live provider subscription', async () => {
    const { webhook, provider } = setup({ status: 'ACTIVE', lemonSubscriptionId: 'different' });
    provider.verifyWebhookSignature.mockReturnValue(created);
    await expect(webhook.handleWebhook(Buffer.from('{}'), 'signed')).rejects.toThrow('Conflicting');
  });
  it('never interprets invoice IDs as subscription IDs', async () => {
    const { webhook, repo, provider } = setup();
    provider.verifyWebhookSignature.mockReturnValue({ ...created, data: { ...created.data, type: 'subscription-invoices' } });
    await expect(webhook.handleWebhook(Buffer.from('{}'), 'signed')).rejects.toThrow();
    expect(repo.attachProviderSubscription).not.toHaveBeenCalled();
  });
});
