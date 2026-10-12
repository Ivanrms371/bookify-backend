import { VerificationCreatedListener } from '../listeners/verifications/verification-created.listener';
import { CustomerVerificationTemplate } from '../application/templates/customer-verification/customer-verification.template';
import { NotificationDeliveryRepository } from '../infraestructure/repositories/notification-delivery.repository';
import { NotificationsService } from '../application/services/notifications.service';
import { NotificationConfigService } from '../notification-config.service';

it.each(['EMAIL', 'WHATSAPP'] as const)('queues the saved customer %s OTP in the verification transaction', async (channel) => {
  const notifications = { createOccurrence: jest.fn(), create: jest.fn() };
  const users = { findById: jest.fn() };
  const listener = new VerificationCreatedListener(notifications as never, { get: jest.fn() } as never, users as never);
  const tx = {};
  await listener.handle({
    type: 'CUSTOMER_VERIFICATION_EMAIL' as never,
    verificationId: 'verification',
    recipientId: 'customer',
    recipientType: 'CUSTOMER',
    tenantId: 'tenant',
    channel,
    code: '123456',
    email: 'saved@example.test',
    phone: '+59899123456',
    expiresAt: new Date('2030-01-01'),
    tx: tx as never,
  });
  expect(notifications.createOccurrence).toHaveBeenCalledWith(
    {
      type: 'customer.verification',
      tenantId: 'tenant',
      referenceId: 'verification',
      recipientId: 'customer',
      recipientType: 'CUSTOMER',
      occurrenceKey: 'customer-verification:verification',
      expiresAt: new Date('2030-01-01'),
      payload: { code: '123456', email: 'saved@example.test', phone: '+59899123456' },
    },
    tx,
    channel,
  );
  expect(notifications.create).not.toHaveBeenCalled();
  expect(users.findById).not.toHaveBeenCalled();
});
it('propagates outbox persistence failures to the verification transaction', async () => {
  const listener = new VerificationCreatedListener(
    { createOccurrence: jest.fn().mockRejectedValue(new Error('database unavailable')) } as never,
    { get: jest.fn() } as never,
    {} as never,
  );
  await expect(
    listener.handle({
      type: 'CUSTOMER_VERIFICATION_EMAIL' as never,
      verificationId: 'v',
      recipientId: 'c',
      recipientType: 'CUSTOMER',
      tenantId: 't',
      code: '123456',
      channel: 'EMAIL',
      expiresAt: new Date(),
      tx: {} as never,
    }),
  ).rejects.toThrow('database unavailable');
});
it('persists only the selected initial email channel while WhatsApp is non-operational', async () => {
  const repository = { createOccurrence: jest.fn().mockResolvedValue({ id: 'notification' }) };
  const events = { emit: jest.fn() };
  const service = new NotificationsService(
    events as never,
    new NotificationConfigService(),
    repository as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const tx = {};
  const params = {
    type: 'customer.verification',
    tenantId: 'tenant',
    recipientId: 'customer',
    recipientType: 'CUSTOMER' as const,
    occurrenceKey: 'otp',
    expiresAt: new Date(),
    payload: { code: '123456' },
  };
  await service.createOccurrence(params, tx as never, 'EMAIL');
  expect(repository.createOccurrence).toHaveBeenCalledWith(params, ['EMAIL'], tx);
  expect(events.emit).not.toHaveBeenCalled();
});
it('renders the same OTP for email and WhatsApp without a magic link', () => {
  const template = new CustomerVerificationTemplate();
  expect(template.build('WHATSAPP', { code: '123456' })).toEqual({ body: expect.stringContaining('123456') });
  const email = template.build('EMAIL', { code: '123456' });
  expect(email.subject).toBe('Tu código de verificación');
  expect(JSON.stringify(email.react)).toContain('123456');
  expect(JSON.stringify(email.react)).not.toContain('href');
});
it('uses the existing unique notification/channel key to make concurrent fallbacks idempotent', async () => {
  const upsert = jest.fn().mockResolvedValue({ id: 'fallback' });
  const repository = new NotificationDeliveryRepository({ notificationDelivery: { upsert } } as never);
  await Promise.all([repository.ensureFallback('notification', 'EMAIL'), repository.ensureFallback('notification', 'EMAIL')]);
  expect(upsert).toHaveBeenCalledWith({
    where: { notificationId_channel: { notificationId: 'notification', channel: 'EMAIL' } },
    create: { notificationId: 'notification', channel: 'EMAIL', runAt: expect.any(Date) },
    update: {},
  });
});
it('preserves user notification failure handling for non-awaited events', async () => {
  const logger = jest.spyOn(require('@nestjs/common').Logger.prototype, 'error').mockImplementation(() => {});
  try {
    const listener = new VerificationCreatedListener(
      { create: jest.fn().mockRejectedValue(new Error('queue failed')) } as never,
      { get: jest.fn() } as never,
      { findById: jest.fn().mockResolvedValue({ name: 'User' }) } as never,
    );
    await expect(
      listener.handle({
        type: 'USER_EMAIL_VERIFICATION',
        verificationId: 'v',
        recipientId: 'u',
        recipientType: 'USER',
        token: 'token',
        expiresAt: new Date(),
      }),
    ).resolves.toBeUndefined();
    expect(logger).toHaveBeenCalled();
  } finally {
    logger.mockRestore();
  }
});
