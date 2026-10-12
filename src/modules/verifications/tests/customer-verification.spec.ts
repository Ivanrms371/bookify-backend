import { createHash } from 'crypto';
import { Logger } from '@nestjs/common';
import { VerificationsService } from '../core/verifications.service';
import { WhatsappGateway } from 'src/modules/notifications/infraestructure/gateways/whatsapp.gateway';
import { requiresCustomerVerification } from '../domain/customer-verification-policy';
import { getVerificationExpiresAt, OTP_TTL_MS } from '../domain/verification-rules';

import type { VerificationCreatedEvent } from '../types/verification-created-event';

type TestChallenge = {
  id: string;
  tenantId: string;
  recipientId: string;
  recipientType: string;
  type: string;
  channel: string;
  destination: string;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
  attempts: number;
  lockedAt: Date | null;
  verifiedAt: Date | null;
  contactWasMissing?: boolean;
};
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function fixture() {
  const customer = {
    id: 'customer',
    tenantId: 'tenant',
    name: 'Stored',
    email: 'saved@example.test',
    phoneCountryCode: '598',
    phoneNumber: '99123456',
    deletedAt: null,
    blockedAt: null,
    phoneVerifiedAt: null,
    whatsappOptInAt: null,
    emailVerifiedAt: null,
  };
  const subscription = { planId: 'pro', status: 'ACTIVE', deletedAt: null, pendingPlanId: null, endsAt: null };
  const records = new Map<string, TestChallenge>();
  const tx = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    customer: {
      findFirst: jest.fn(({ where }: { where: { id: string; tenantId: string } }) =>
        Promise.resolve(
          where.id === customer.id && where.tenantId === customer.tenantId && !customer.deletedAt && !customer.blockedAt ? customer : null,
        ),
      ),
      update: jest.fn(({ data }: { data: Partial<typeof customer> }) => Promise.resolve(Object.assign(customer, data))),
    },
    subscription: { findUnique: jest.fn(() => Promise.resolve(subscription)) },
    appointment: { count: jest.fn().mockResolvedValue(0) },
    verification: {
      findFirst: jest.fn(() => Promise.resolve(records.values().next().value ?? null)),
      create: jest.fn(({ data }: { data: Omit<TestChallenge, 'id' | 'attempts' | 'lockedAt' | 'verifiedAt'> }) => {
        const record = { id: `v-${records.size}`, attempts: 0, lockedAt: null, verifiedAt: null, ...data };
        records.set(record.id, record);
        return Promise.resolve(record);
      }),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(records.get(where.id) ?? null)),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<Omit<TestChallenge, 'attempts'>> & { attempts?: { increment: number } };
        }) => {
          const record = records.get(where.id)!;
          const { attempts, ...rest } = data;
          Object.assign(record, rest);
          if (attempts?.increment) record.attempts += attempts.increment;
          return Promise.resolve(record);
        },
      ),
    },
  };
  // Serialize transactions to model the row-lock boundary used by completion.
  let queue = Promise.resolve();
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => {
      const result = queue.then(() => fn(tx));
      queue = result.then(
        () => {},
        () => {},
      );
      return result;
    }),
  };
  const events = {
    emit: jest.fn(),
    emitAsync: jest.fn<Promise<unknown[]>, [string, VerificationCreatedEvent & { code: string }]>().mockResolvedValue([]),
  };
  const users = { markPhoneAsVerified: jest.fn().mockResolvedValue(undefined) };
  const service = new VerificationsService(prisma as never, users as never, events as never);
  const challenge = (channel: 'EMAIL' | 'WHATSAPP' = 'EMAIL') => {
    const record = {
      id: 'challenge',
      tenantId: 'tenant',
      recipientId: 'customer',
      recipientType: 'CUSTOMER',
      type: channel === 'EMAIL' ? 'CUSTOMER_VERIFICATION_EMAIL' : 'CUSTOMER_VERIFICATION_PHONE',
      channel,
      destination: channel === 'EMAIL' ? customer.email : '+59899123456',
      codeHash: hash('123456'),
      expiresAt: new Date(Date.now() + 600000),
      maxAttempts: 3,
      attempts: 0,
      lockedAt: null,
      verifiedAt: null,
    };
    records.set(record.id, record);
    return record;
  };
  return { service, users, events, customer, subscription, tx, records, challenge };
}
afterEach(() => jest.restoreAllMocks());
it.each([
  [null, false],
  [{ planId: 'free', status: 'ACTIVE' }, false],
  [{ planId: 'pro', status: 'TRIAL', trialEndsAt: new Date('2030-01-01') }, false],
  [{ planId: 'pro', status: 'ACTIVE' }, true],
  [{ planId: 'pro_plus', status: 'ACTIVE' }, true],
  [{ planId: 'pro', status: 'CANCELLED', endsAt: new Date('2030-01-01') }, true],
  [{ planId: 'pro', status: 'CANCELLED', endsAt: new Date(0) }, false],
  [{ planId: 'pro', status: 'PAUSED' }, false],
  [{ planId: 'pro', status: 'PAST_DUE' }, false],
  [{ planId: 'pro', status: 'ACTIVE', deletedAt: new Date() }, false],
  [{ planId: 'pro', status: 'ACTIVE', pendingPlanId: 'free', planChangesAt: new Date(0) }, false],
])('evaluates effective paid access: %j => %s', (subscription, expected) => {
  expect(requiresCustomerVerification(subscription as never)).toBe(expected);
});
it('uses the existing ten-minute lifetime for customer email OTPs', () => {
  expect(getVerificationExpiresAt('CUSTOMER_VERIFICATION_EMAIL', new Date(0)).getTime()).toBe(OTP_TTL_MS);
});
it.each(['free', 'trial', 'verified'])('skips challenges for %s customers', async (mode) => {
  const f = fixture();
  if (mode === 'free') f.subscription.planId = 'free';
  if (mode === 'trial') Object.assign(f.subscription, { status: 'TRIAL', trialEndsAt: new Date(Date.now() + 10000) });
  if (mode === 'verified') Object.assign(f.customer, { emailVerifiedAt: new Date() });
  expect(await f.service.requestCustomerVerification('tenant', 'customer')).toEqual({
    customerId: 'customer',
    verificationRequired: false,
  });
  expect(f.tx.verification.create).not.toHaveBeenCalled();
  expect(f.events.emitAsync).not.toHaveBeenCalled();
});
it.each(['EMAIL', 'WHATSAPP'] as const)('creates a six-digit %s OTP and durable event with saved snapshots', async (channel) => {
  const f = fixture();
  jest.spyOn(WhatsappGateway, 'isOperational').mockReturnValue(channel === 'WHATSAPP');
  const result = await f.service.requestCustomerVerification('tenant', 'customer', undefined, channel === 'WHATSAPP');
  expect(result).toEqual({ customerId: 'customer', verificationRequired: true, verificationId: 'v-0' });
  const event = f.events.emitAsync.mock.calls[0][1];
  expect(event).toMatchObject({
    code: expect.stringMatching(/^\d{6}$/) as unknown,
    channel,
    phone: '+59899123456',
    email: channel === 'EMAIL' ? 'saved@example.test' : null,
    tx: f.tx,
  });
  expect(f.records.get('v-0')).toMatchObject({
    codeHash: hash(event.code),
    channel,
    destination: channel === 'EMAIL' ? f.customer.email : '+59899123456',
  });
  expect(result).not.toHaveProperty('code');
  expect(result).not.toHaveProperty('email');
});
it('resend preserves independent challenges', async () => {
  const f = fixture();
  const old = f.challenge();
  await f.service.requestCustomerVerification('tenant', 'customer');
  await f.service.requestCustomerVerification('tenant', 'customer');
  expect(old.lockedAt).toBeNull();
  expect(f.records.size).toBe(3);
});
it('does not bypass verification on unavailable contacts or outbox failures', async () => {
  const f = fixture();
  f.customer.email = '';
  await expect(f.service.requestCustomerVerification('tenant', 'customer')).rejects.toThrow('contacto disponible');
  f.customer.email = 'saved@example.test';
  f.events.emitAsync.mockRejectedValue(new Error('outbox failed'));
  await expect(f.service.requestCustomerVerification('tenant', 'customer')).rejects.toThrow('outbox failed');
});
it.each(['EMAIL', 'WHATSAPP'] as const)('completes only the exact %s contact by verification ID', async (channel) => {
  const f = fixture();
  const record = f.challenge(channel);
  expect(await f.service.verifyCustomerCode(record.id, '123456')).toEqual({ success: true });
  expect(record.verifiedAt).toBeInstanceOf(Date);
  expect(f.customer[channel === 'EMAIL' ? 'emailVerifiedAt' : 'phoneVerifiedAt']).toBeInstanceOf(Date);
  expect(f.customer[channel === 'EMAIL' ? 'phoneVerifiedAt' : 'emailVerifiedAt']).toBeNull();
  expect(f.customer.whatsappOptInAt).toEqual(channel === 'WHATSAPP' ? expect.any(Date) : null);
  await expect(f.service.verifyCustomerCode(record.id, '123456')).rejects.toThrow();
});
it('commits three wrong attempts and rejects a subsequent correct code', async () => {
  const f = fixture();
  const record = f.challenge();
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => f.service.verifyCustomerCode(record.id, '000000')));
  expect(results.every((r) => r.status === 'rejected')).toBe(true);
  expect(record.attempts).toBe(3);
  expect(record.lockedAt).toBeInstanceOf(Date);
  await expect(f.service.verifyCustomerCode(record.id, '123456')).rejects.toThrow();
  expect(f.tx.customer.update).not.toHaveBeenCalled();
});
it('allows exactly one concurrent successful completion', async () => {
  const f = fixture();
  const record = f.challenge();
  const results = await Promise.allSettled([
    f.service.verifyCustomerCode(record.id, '123456'),
    f.service.verifyCustomerCode(record.id, '123456'),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(f.tx.customer.update).toHaveBeenCalledTimes(1);
});
it.each([
  { destination: 'other@example.test' },
  { expiresAt: new Date(0) },
  { lockedAt: new Date() },
  { recipientType: 'USER' },
  { type: 'PASSWORD_RESET' },
])('rejects changed or invalid verification: %j', async (patch) => {
  const f = fixture();
  Object.assign(f.challenge(), patch);
  await expect(f.service.verifyCustomerCode('challenge', '123456')).rejects.toThrow();
  expect(f.tx.customer.update).not.toHaveBeenCalled();
});
it.each(['deletedAt', 'blockedAt'])('rejects %s customers on request, verification and booking', async (field) => {
  const f = fixture();
  f.challenge();
  f.customer[field] = new Date();
  await expect(f.service.requestCustomerVerification('tenant', 'customer')).rejects.toThrow();
  await expect(f.service.verifyCustomerCode('challenge', '123456')).rejects.toThrow();
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).rejects.toThrow();
});
it('checks paid access again at booking and rejects foreign customers', async () => {
  const f = fixture();
  f.subscription.planId = 'free';
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).resolves.toBe(f.customer);
  f.subscription.planId = 'pro';
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).rejects.toThrow('verificar');
  Object.assign(f.customer, { phoneVerifiedAt: new Date() });
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).rejects.toThrow();
  Object.assign(f.customer, { emailVerifiedAt: new Date() });
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).resolves.toBe(f.customer);
  await expect(f.service.eligibleCustomer('customer', 'foreign', f.tx as never)).rejects.toThrow();
});
it('logs the sixth future booking while allowing it', async () => {
  const f = fixture();
  f.subscription.planId = 'free';
  f.tx.appointment.count.mockResolvedValue(5);
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  await expect(f.service.eligibleCustomer('customer', 'tenant', f.tx as never)).resolves.toBe(f.customer);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('PUBLIC_BOOKING_FUTURE_LIMIT'));
});

it('preserves saved email and rejects a different proposed email without exposing it', async () => {
  const f = fixture();
  await expect(f.service.requestCustomerVerification('tenant', 'customer', 'other@example.test')).rejects.toThrow('no coincide');
  expect(f.tx.customer.update).not.toHaveBeenCalled();
});
it('adds absent email only after OTP and rejects a concurrent email write', async () => {
  const f = fixture();
  f.customer.email = '';
  await f.service.requestCustomerVerification('tenant', 'customer', 'new@example.test');
  expect(f.customer.email).toBe('');
  const event = f.events.emitAsync.mock.calls[0][1];
  await f.service.verifyCustomerCode('v-0', event.code);
  expect(f.customer.email).toBe('new@example.test');
  f.customer.email = '';
  await f.service.requestCustomerVerification('tenant', 'customer', 'next@example.test');
  f.customer.email = 'next@example.test';
  await expect(f.service.verifyCustomerCode('v-1', f.events.emitAsync.mock.calls[1][1].code)).rejects.toThrow();
});
it('keeps WhatsApp activation optional, unavailable while simulated and skips existing opt-in', async () => {
  const f = fixture();
  await expect(f.service.requestCustomerVerification('tenant', 'customer', undefined, true)).rejects.toThrow('no está disponible');
  Object.assign(f.customer, { phoneVerifiedAt: new Date(), whatsappOptInAt: new Date() });
  await expect(f.service.requestCustomerVerification('tenant', 'customer', undefined, true)).resolves.toMatchObject({
    verificationRequired: false,
  });
  expect(f.tx.verification.create).not.toHaveBeenCalled();
});

it('public customer confirmation delegates to verifyCode and keeps its response minimal', async () => {
  const f = fixture();
  f.challenge();
  const verify = jest.spyOn(f.service, 'verifyCode');
  await expect(f.service.verifyCustomerCode('challenge', '123456')).resolves.toEqual({ success: true });
  expect(verify).toHaveBeenCalledWith({ verificationId: 'challenge', code: '123456' });
});
it('uses the shared OTP flow for user phone verification without updating a customer', async () => {
  const f = fixture();
  Object.assign(f.challenge('WHATSAPP'), { recipientType: 'USER', type: 'USER_PHONE_VERIFICATION', recipientId: 'user' });
  await expect(
    f.service.verifyCode({ recipientId: 'user', recipientType: 'USER', type: 'USER_PHONE_VERIFICATION', code: '123456' }),
  ).resolves.toEqual({ success: true, recipientId: 'user', recipientType: 'USER' });
  expect(f.users.markPhoneAsVerified).toHaveBeenCalledWith('user', f.tx);
  expect(f.tx.customer.update).not.toHaveBeenCalled();
  await expect(
    f.service.verifyCode({ recipientId: 'user', recipientType: 'USER', type: 'USER_PHONE_VERIFICATION', code: '123456' }),
  ).rejects.toThrow('utilizado');
});
it('commits user OTP failed attempts through the same validator and blocks further attempts', async () => {
  const f = fixture();
  const record = Object.assign(f.challenge('WHATSAPP'), { recipientType: 'USER', type: 'USER_PHONE_VERIFICATION', recipientId: 'user' });
  const dto = { recipientId: 'user', recipientType: 'USER' as const, type: 'USER_PHONE_VERIFICATION' as const, code: '000000' };
  for (let attempt = 0; attempt < 3; attempt++) await expect(f.service.verifyCode(dto)).rejects.toThrow('incorrecto');
  expect(record.attempts).toBe(3);
  await expect(f.service.verifyCode({ ...dto, code: '123456' })).rejects.toThrow('bloqueado');
  expect(f.users.markPhoneAsVerified).not.toHaveBeenCalled();
});
it('propagates contact update failures out of the confirmation transaction', async () => {
  const f = fixture();
  f.challenge();
  f.tx.customer.update.mockRejectedValueOnce(new Error('contact update failed'));
  await expect(f.service.verifyCustomerCode('challenge', '123456')).rejects.toThrow('contact update failed');
});
