import { TenantUsageService } from 'src/modules/tenants/features/usage/tenant-usage.service';
import { TenantUsageRepository } from 'src/modules/tenants/features/usage/tenant-usage.repository';
import { NotificationUsageService } from '../application/services/notification-usage.service';
import { NotificationConfigService } from '../notification-config.service';
import type { NotificationProcessorInput } from '../types/notification-processor.type';

const delivery = {
  id: 'delivery',
  channel: 'EMAIL',
  retryCount: 0,
  notification: { tenantId: 'tenant', type: 'appointment.created', recipientType: 'USER' },
} as NotificationProcessorInput;
const config = new NotificationConfigService();
function setup() {
  const tx = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    subscription: { findUnique: jest.fn().mockResolvedValue({ planId: 'pro', status: 'ACTIVE' }) },
    tenantUsage: { findUnique: jest.fn().mockResolvedValue({ emailLimit: 400, whatsappLimit: 200 }) },
  };
  const prisma = { ...tx, $transaction: jest.fn((work) => work(tx)) };
  return {
    service: new NotificationUsageService(
      prisma as never,
      config,
      new TenantUsageService(new TenantUsageRepository(prisma as never), prisma as never),
    ),
    prisma,
    tx,
  };
}

afterEach(() => jest.useRealTimers());
it.each([
  ['verification.email.created', 'USER', 'EMAIL'],
  ['invitation.created', 'USER', 'EMAIL'],
  ['customer.verification', 'CUSTOMER', 'EMAIL'],
  ['customer.verification', 'CUSTOMER', 'WHATSAPP'],
  ['appointment.cancelled', 'USER', 'IN_APP'],
  ['unknown', 'USER', 'EMAIL'],
])('excludes %s / %s / %s without reading quota', async (type, recipientType, channel) => {
  const { service, prisma } = setup();
  expect(
    await service.reserve({
      ...delivery,
      channel,
      notification: { ...delivery.notification, type, recipientType, tenantId: null },
    } as NotificationProcessorInput),
  ).toBe(true);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it('keeps customer OTP channels non-billable and email fallback-only', () => {
  expect(config.isBillable('customer.verification', 'CUSTOMER', 'EMAIL')).toBe(false);
  expect(config.isBillable('customer.verification', 'CUSTOMER', 'WHATSAPP')).toBe(false);
  expect(config.getChannels('customer.verification', 'CUSTOMER').map((c) => c.channel)).toEqual(['WHATSAPP']);
  expect(config.getChannelConfig('customer.verification', 'CUSTOMER', 'WHATSAPP')?.fallback).toBeUndefined();
  expect(config.getChannels('verification.email.created', 'CUSTOMER')).toEqual([]);
  expect(config.getChannels('verification.phoneNumber.created', 'CUSTOMER')).toEqual([]);
  expect(config.isBillable('appointment.created', 'CUSTOMER', 'EMAIL')).toBe(true);
  expect(config.getChannels('appointment.created', 'CUSTOMER').map((c) => c.channel)).toEqual(['WHATSAPP']);
});
it('denies billable delivery without tenant', async () => {
  const { service, prisma } = setup();
  expect(await service.reserve({ ...delivery, notification: { ...delivery.notification, tenantId: null } })).toBe(false);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it('denies exhausted quota without inserting a reservation', async () => {
  const { service, tx } = setup();
  tx.$queryRaw
    .mockResolvedValueOnce([{ id: delivery.id }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  expect(await service.reserve(delivery)).toBe(false);
  expect(tx.$executeRaw).toHaveBeenCalledTimes(1); // entitlements lock only
});
it.each(['EMAIL', 'WHATSAPP'])('conditionally reserves finite %s quota using UTC and saves in the same transaction', async (channel) => {
  jest.useFakeTimers().setSystemTime(new Date('2027-01-01T00:30:00Z'));
  const { service, tx } = setup();
  tx.$queryRaw
    .mockResolvedValueOnce([{ id: delivery.id }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'usage' }]);
  expect(
    await service.reserve({
      ...delivery,
      channel,
      notification: { ...delivery.notification, recipientType: 'CUSTOMER' },
    } as NotificationProcessorInput),
  ).toBe(true);
  const update = tx.$queryRaw.mock.calls[2][0];
  const prefix = channel.toLowerCase();
  expect(update.sql).toContain(`${prefix}_limit > 0 AND ${prefix}_count < ${prefix}_limit`);
  expect(update.values).toEqual(['tenant', 1, 2027]);
  expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
});
it.each(['RESERVED', 'CONFIRMED'])('reuses a %s reservation even across months', async (state) => {
  const { service, tx } = setup();
  tx.$queryRaw.mockResolvedValueOnce([{ id: delivery.id }]).mockResolvedValueOnce([{ state, usageId: 'old-period' }]);
  expect(await service.reserve(delivery)).toBe(true);
  expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  expect(tx.$executeRaw).toHaveBeenCalledTimes(1); // entitlements lock only
});
it('reacquires a released reservation', async () => {
  const { service, tx } = setup();
  tx.$queryRaw
    .mockResolvedValueOnce([{ id: delivery.id }])
    .mockResolvedValueOnce([{ state: 'RELEASED' }])
    .mockResolvedValueOnce([{ id: 'usage' }]);
  expect(await service.reserve(delivery)).toBe(true);
  expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
});
it('releases only an unambiguous reserved delivery and decrements its original period', async () => {
  const { service, tx } = setup();
  tx.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ usageId: 'original-month', channel: 'EMAIL' }]);
  await service.release('delivery');
  expect(tx.$queryRaw.mock.calls[1][0].join('')).toContain("state = 'RESERVED' AND ambiguous = false");
  expect(tx.$executeRaw.mock.calls[1][0].values).toEqual(['original-month']);
});
it('does not decrement twice or release ambiguous/confirmed reservations', async () => {
  const { service, tx } = setup();
  tx.$queryRaw.mockResolvedValue([]);
  await service.release('delivery');
  expect(tx.$executeRaw).toHaveBeenCalledTimes(1); // entitlements lock only
});

it.each(['EXPIRED', 'PAST_DUE', 'PAUSED', 'SUSPENDED'])('blocks retries after entitlement becomes %s', async (status) => {
  const { service, tx } = setup();
  tx.subscription.findUnique.mockResolvedValue({ planId: 'pro', status });
  tx.tenantUsage.findUnique.mockResolvedValue({ emailLimit: 0, whatsappLimit: 0 });
  expect(await service.reserve({ ...delivery, retryCount: 1 })).toBe(false);
  expect(tx.$queryRaw).toHaveBeenCalledTimes(1); // Only the delivery lock; no counter/reservation mutation.
});

it('keeps reserved capacity after a positive-limit downgrade even above the new limit', async () => {
  const { service, tx } = setup();
  tx.tenantUsage.findUnique.mockResolvedValue({ emailLimit: 400, whatsappLimit: 200, emailCount: 900 } as never);
  tx.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ state: 'RESERVED', usageId: 'old-month' }]);
  expect(await service.reserve({ ...delivery, retryCount: 1 })).toBe(true);
  expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
});

it('waits for the entitlements lock before reading eligibility or locking delivery rows', async () => {
  const { service, tx } = setup();
  let unlock!: () => void;
  tx.$executeRaw.mockImplementationOnce(() => new Promise<void>((resolve) => (unlock = resolve)));
  const reservation = service.reserve(delivery);
  expect(tx.subscription.findUnique).not.toHaveBeenCalled();
  expect(tx.$queryRaw).not.toHaveBeenCalled();
  // A subscription change winning the lock is visible before the reservation proceeds.
  tx.subscription.findUnique.mockResolvedValue({ planId: 'free', status: 'ACTIVE' });
  tx.tenantUsage.findUnique.mockResolvedValue({ emailLimit: 0, whatsappLimit: 0 });
  unlock();
  expect(await reservation).toBe(false);
});
