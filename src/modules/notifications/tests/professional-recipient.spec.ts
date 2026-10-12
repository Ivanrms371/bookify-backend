import { NotificationRecipientResolver } from '../application/services/notification-recipient-resolver.service';
import { NotificationGatewaysService } from '../infraestructure/gateways/notification-gateways.service';
import { InAppNotificationsService } from '../application/services/in-app-notifications.service';
import { DeliverySkippedError } from '../errors/delivery-skipped.error';
import type { Notification } from 'src/generated/prisma/client';

const notification: Notification = {
  occurrenceKey: null,
  expiresAt: null,
  id: 'notification',
  tenantId: 'tenant',
  recipientId: 'professional',
  recipientType: 'PROFESSIONAL',
  type: 'appointment.created',
  referenceId: 'appointment',
  payload: { appointmentId: 'appointment' },
  createdAt: new Date(),
  updatedAt: new Date(),
};
function fixture() {
  const professional = {
    id: 'professional',
    userId: 'linked-user',
    email: ' professional@example.com ',
    phoneCountryCode: '598',
    phoneNumber: '123',
  };
  const users = { findById: jest.fn().mockResolvedValue({ email: 'user@example.com' }) };
  const customers = { findById: jest.fn().mockResolvedValue({ email: 'customer@example.com' }) };
  const prisma = {
    professional: { findFirst: jest.fn().mockResolvedValue(professional) },
    appointment: { findFirst: jest.fn().mockResolvedValue({ professionalId: 'professional' }) },
    membership: { findFirst: jest.fn().mockResolvedValue({ id: 'membership' }) },
  };
  const resolver = new NotificationRecipientResolver(users as never, customers as never, prisma as never);
  return { resolver, users, customers, prisma, professional };
}
it.each(['linked-user', null])('uses the professional email with userId=%s', async (userId) => {
  const f = fixture();
  f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, userId } as never);
  expect(await f.resolver.resolve('EMAIL', notification)).toBe('professional@example.com');
  expect(f.users.findById).not.toHaveBeenCalled();
  expect(f.prisma.professional.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'professional', tenantId: 'tenant', deletedAt: null },
    }),
  );
});
it.each(['', '   ', null])('skips missing professional email %s without falling back to the user', async (email) => {
  const f = fixture();
  f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, email } as never);
  await expect(f.resolver.resolve('EMAIL', notification)).rejects.toBeInstanceOf(DeliverySkippedError);
  expect(f.users.findById).not.toHaveBeenCalled();
});
it('resolves a linked active dashboard member separately from professional contact information', async () => {
  const f = fixture();
  expect(await f.resolver.resolve('IN_APP', notification)).toBe('linked-user');
  expect(f.prisma.membership.findFirst).toHaveBeenCalledWith({
    where: { tenantId: 'tenant', userId: 'linked-user', isActive: true },
    select: { id: true },
  });
});
it('skips dashboard delivery to an unlinked professional while keeping email available', async () => {
  const f = fixture();
  f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, userId: null } as never);
  await expect(f.resolver.resolve('IN_APP', notification)).rejects.toThrow('no linked dashboard user');
  expect(f.prisma.membership.findFirst).not.toHaveBeenCalled();
  expect(await f.resolver.resolve('EMAIL', notification)).toBe('professional@example.com');
});
it('skips in-app delivery when the active tenant membership query finds no match, while preserving email', async () => {
  const f = fixture();
  f.prisma.membership.findFirst.mockResolvedValue(null as never);
  await expect(f.resolver.resolve('IN_APP', notification)).rejects.toThrow('no active tenant membership');
  expect(await f.resolver.resolve('EMAIL', notification)).toBe('professional@example.com');
});
it('does not resolve a professional without a tenant or from another tenant', async () => {
  const f = fixture();
  await expect(f.resolver.resolve('EMAIL', { ...notification, tenantId: null })).rejects.toThrow('requires a tenant');
  expect(f.prisma.professional.findFirst).not.toHaveBeenCalled();
  f.prisma.professional.findFirst.mockResolvedValue(null as never);
  await expect(f.resolver.resolve('EMAIL', notification)).rejects.toThrow('not found in tenant');
  expect(f.users.findById).not.toHaveBeenCalled();
});
it.each(['appointment.created', 'appointment.rescheduled', 'appointment.cancelled'])(
  'resolves a legacy USER %s via its scoped appointment',
  async (type) => {
    const f = fixture();
    const legacy = { ...notification, recipientType: 'USER' as const, recipientId: 'linked-user', type };
    expect(await f.resolver.resolve('EMAIL', legacy)).toBe('professional@example.com');
    expect(f.prisma.appointment.findFirst).toHaveBeenCalledWith({
      where: { id: 'appointment', tenantId: 'tenant' },
      select: { professionalId: true },
    });
    expect(f.users.findById).not.toHaveBeenCalled();
  },
);
it('supports the payload appointment ID on legacy cancellation notices without referenceId', async () => {
  const f = fixture();
  expect(await f.resolver.resolve('EMAIL', { ...notification, recipientType: 'USER', referenceId: null })).toBe('professional@example.com');
});
it.each(['missing-id', 'missing-or-foreign-appointment'])('stops an unresolvable legacy professional notice: %s', async (reason) => {
  const f = fixture();
  f.prisma.appointment.findFirst.mockResolvedValue(null as never);
  const legacy = { ...notification, recipientType: 'USER' as const };
  if (reason === 'missing-id') {
    legacy.referenceId = null;
    legacy.payload = {};
  }
  await expect(f.resolver.resolve('EMAIL', legacy)).rejects.toBeInstanceOf(DeliverySkippedError);
  expect(f.users.findById).not.toHaveBeenCalled();
  expect(f.prisma.professional.findFirst).not.toHaveBeenCalled();
});
it('keeps verification user email and customer email resolution unchanged', async () => {
  const f = fixture();
  expect(
    await f.resolver.resolve('EMAIL', { ...notification, recipientType: 'USER', type: 'verification.email.created', recipientId: 'user' }),
  ).toBe('user@example.com');
  expect(f.users.findById).toHaveBeenCalledWith('user');
  expect(await f.resolver.resolve('EMAIL', { ...notification, recipientType: 'CUSTOMER', recipientId: 'customer' })).toBe(
    'customer@example.com',
  );
  expect(f.customers.findById).toHaveBeenCalledWith('tenant', 'customer');
  expect(f.prisma.professional.findFirst).not.toHaveBeenCalled();
});
it('persists and emits in-app content for the resolved user, never the professional ID', async () => {
  const f = fixture();
  const repository = { create: jest.fn().mockResolvedValue({ id: 'in-app' }) };
  const events = { emit: jest.fn() };
  const service = new InAppNotificationsService(repository as never, events as never);
  const gateway = new NotificationGatewaysService({} as never, {} as never, service, f.resolver);
  const content = { title: 'Nueva cita', message: 'Luis reservó', actionUrl: '/appointments/appointment', actionLabel: 'Ver cita' };
  expect(await gateway.send('IN_APP', notification, content)).toBe('in-app');
  expect(repository.create).toHaveBeenCalledWith(
    expect.objectContaining({
      user: { connect: { id: 'linked-user' } },
      tenant: { connect: { id: 'tenant' } },
    }),
  );
  expect(events.emit).toHaveBeenCalledWith(
    'in_app_notification.created',
    expect.objectContaining({ userId: 'linked-user', tenantId: 'tenant' }),
  );
});
it('propagates a skipped destination without invoking an external provider', async () => {
  const f = fixture();
  f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, email: '' });
  const email = { send: jest.fn() };
  const gateway = new NotificationGatewaysService(email as never, {} as never, {} as never, f.resolver);
  await expect(gateway.send('EMAIL', notification, { subject: 'New appointment', react: null })).rejects.toBeInstanceOf(
    DeliverySkippedError,
  );
  expect(email.send).not.toHaveBeenCalled();
});

it.each(['professional.day-start', 'professional.day-end'])(
  'uses professional contact and active dashboard membership for %s',
  async (type) => {
    const f = fixture();
    f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, isActive: true } as never);
    const summary = { ...notification, type };
    expect(await f.resolver.resolve('EMAIL', summary)).toBe('professional@example.com');
    expect(await f.resolver.resolve('IN_APP', summary)).toBe('linked-user');
    expect(f.users.findById).not.toHaveBeenCalled();
    f.prisma.professional.findFirst.mockResolvedValue({ ...f.professional, isActive: false } as never);
    await expect(f.resolver.resolve('EMAIL', summary)).rejects.toThrow('Professional is disabled');
    await expect(f.resolver.resolve('IN_APP', summary)).rejects.toThrow('Professional is disabled');
  },
);
