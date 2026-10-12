import { NotificationRecipientResolver } from '../application/services/notification-recipient-resolver.service';
import { NotificationGatewaysService } from '../infraestructure/gateways/notification-gateways.service';

function fixture(channel: 'EMAIL' | 'WHATSAPP' = 'EMAIL') {
  const customer = {
    id: 'customer',
    email: ' Stored@Example.test ',
    phoneCountryCode: '+598',
    phoneNumber: '99 123-456',
    emailVerifiedAt: null as Date | null,
    phoneVerifiedAt: null as Date | null,
    whatsappOptInAt: null as Date | null,
    blockedAt: null as Date | null,
  };
  const record = {
    id: 'verification',
    tenantId: 'tenant',
    recipientId: 'customer',
    recipientType: 'CUSTOMER',
    type: channel === 'EMAIL' ? 'CUSTOMER_VERIFICATION_EMAIL' : 'CUSTOMER_VERIFICATION_PHONE',
    channel,
    destination: channel === 'EMAIL' ? 'stored@example.test' : '+59899123456',
    lockedAt: null,
    verifiedAt: null,
    expiresAt: new Date(Date.now() + 100000),
  };
  const customers = { findById: jest.fn().mockResolvedValue(customer) };
  const tx = {
    $queryRaw: jest.fn(),
    customer: { findFirst: jest.fn().mockResolvedValue(customer) },
    verification: { findUnique: jest.fn().mockResolvedValue(record), update: jest.fn(async ({ data }) => Object.assign(record, data)) },
    notificationDelivery: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const prisma = { $transaction: jest.fn(async (fn) => fn(tx)) };
  const notification = {
    id: 'notification',
    type: 'customer.verification',
    recipientType: 'CUSTOMER',
    recipientId: 'customer',
    tenantId: 'tenant',
    referenceId: 'verification',
    payload: { code: '123456', email: 'stored@example.test', phone: '+59899123456' },
  };
  const resolver = new NotificationRecipientResolver({} as never, customers as never, prisma as never);
  return { customer, record, notification, resolver, tx };
}
it.each(['EMAIL', 'WHATSAPP'] as const)('passes the exact bound %s contact before verification', async (channel) => {
  const f = fixture(channel);
  expect(await f.resolver.resolve(channel, f.notification as never)).toBe(f.record.destination);
});
it.each(['EMAIL', 'WHATSAPP'] as const)('never redirects a %s challenge to a changed contact', async (channel) => {
  const f = fixture(channel);
  f.customer.email = 'other@example.test';
  f.customer.phoneNumber = '99000000';
  await expect(f.resolver.resolve(channel, f.notification as never)).rejects.toThrow('contact changed');
});
it.each([
  { tenantId: 'other' },
  { recipientId: 'other' },
  { lockedAt: new Date() },
  { verifiedAt: new Date() },
  { expiresAt: new Date(0) },
])('rejects inactive or foreign challenges: %j', async (patch) => {
  const f = fixture();
  Object.assign(f.record, patch);
  await expect(f.resolver.resolve('EMAIL', f.notification as never)).rejects.toThrow();
});
it('never sends a phone OTP by email even after definitive WhatsApp failure', async () => {
  const f = fixture('WHATSAPP');
  f.tx.notificationDelivery.findFirst.mockResolvedValue({ status: 'FAILED' } as never);
  await expect(f.resolver.resolve('EMAIL', f.notification as never)).rejects.toThrow();
  expect(f.tx.verification.update).not.toHaveBeenCalled();
});
it('never switches active contact for an ambiguous phone delivery', async () => {
  const f = fixture('WHATSAPP');
  await expect(f.resolver.resolve('EMAIL', f.notification as never)).rejects.toThrow();
  expect(f.tx.verification.update).not.toHaveBeenCalled();
});
it('rejects fallback if its saved email or original phone changed', async () => {
  for (const field of ['email', 'phoneNumber']) {
    const f = fixture('WHATSAPP');
    f.customer[field] = 'changed';
    f.tx.notificationDelivery.findFirst.mockResolvedValue({ status: 'FAILED' } as never);
    await expect(f.resolver.resolve('EMAIL', f.notification as never)).rejects.toThrow();
  }
});
it('rechecks a customer verification destination at gateway dispatch', async () => {
  const email = { send: jest.fn() };
  const resolver = { resolve: jest.fn().mockResolvedValue('bound@example.test') };
  const gateway = new NotificationGatewaysService(email as never, {} as never, {} as never, resolver as never);
  const f = fixture();
  await gateway.send('EMAIL', f.notification as never, {} as never, 'delivery', 'stale@example.test');
  expect(email.send).toHaveBeenCalledWith('bound@example.test', {}, 'delivery');
});
it('allows email reminders without verification and requires consent for WhatsApp', async () => {
  const f = fixture();
  f.notification.type = 'appointment.reminder';
  await expect(f.resolver.resolve('EMAIL', f.notification as never)).resolves.toBe('Stored@Example.test');
  f.customer.phoneVerifiedAt = new Date();
  await expect(f.resolver.resolve('WHATSAPP', f.notification as never)).rejects.toThrow();
  f.customer.whatsappOptInAt = new Date();
  await expect(f.resolver.resolve('WHATSAPP', f.notification as never)).resolves.toBe('+59899123456');
});
