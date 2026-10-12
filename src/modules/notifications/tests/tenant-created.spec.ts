import { ConfigService } from '@nestjs/config';
import { renderToStaticMarkup } from 'react-dom/server';
import { TenantCreatedListener } from '../listeners/tenants/tenant-created.listener';
import { TenantCreatedTemplate } from '../application/templates/tenant-created/tenant-created.template';
import { NotificationsService } from '../application/services/notifications.service';
import { NotificationsRepository } from '../infraestructure/repositories/notifications.repository';
import { NotificationConfigService } from '../notification-config.service';
import { NotificationUsageService } from '../application/services/notification-usage.service';
import type { BuildEmailResponse } from '../domain/templates/build-email.interface';

const event = { tenantId: 'tenant', completedAt: '2026-10-10T02:00:00.000Z' };
const tenant = {
  id: 'tenant',
  name: 'Salón <script>',
  slug: 'salon',
  settings: { timeZone: 'America/Montevideo' },
  memberships: [{ userId: 'owner' }],
};
function setup() {
  const tx = { tenant: { findFirst: jest.fn().mockResolvedValue(tenant) } };
  const prisma = { tenant: { findFirst: jest.fn().mockResolvedValue(tenant) } };
  const notifications = { createOccurrence: jest.fn() };
  const listener = new TenantCreatedListener(
    prisma as never,
    notifications as never,
    new ConfigService({ APP_URL: 'https://app.example.com' }),
  );
  return { tx, prisma, notifications, listener };
}
it('reuses tenant.created and queues owner channels in the onboarding transaction with a stable key and expiry', async () => {
  const f = setup();
  await f.listener.handle(event, f.tx as never);
  expect(f.prisma.tenant.findFirst).not.toHaveBeenCalled();
  expect(f.tx.tenant.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'tenant', deletedAt: null, isActive: true, onboardingStatus: 'COMPLETED' },
    }),
  );
  expect(f.notifications.createOccurrence).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'tenant.created',
      recipientType: 'USER',
      recipientId: 'owner',
      tenantId: 'tenant',
      referenceId: 'tenant',
      occurrenceKey: 'tenant:onboarding.completed:owner',
      expiresAt: new Date('2026-10-17T02:00Z'),
      payload: expect.objectContaining({ tenantName: tenant.name, businessPath: '/salon', businessUrl: 'https://app.example.com/salon' }),
    }),
    f.tx,
  );
});
it('keeps occurrence identity stable across event replays and isolates each active owner', async () => {
  const f = setup();
  f.tx.tenant.findFirst.mockResolvedValue({ ...tenant, memberships: [{ userId: 'owner' }, { userId: 'other' }] });
  await f.listener.handle(event, f.tx as never);
  await f.listener.handle({ ...event, completedAt: '2026-10-10T03:00:00Z' }, f.tx as never);
  const calls = f.notifications.createOccurrence.mock.calls;
  expect(calls[0][0].occurrenceKey).toBe(calls[2][0].occurrenceKey);
  expect(calls[1][0].recipientId).toBe('other');
});
it('skips missing/draft tenants and owners, and propagates persistence failures to the transaction', async () => {
  const f = setup();
  f.tx.tenant.findFirst.mockResolvedValueOnce(null as never).mockResolvedValueOnce({ ...tenant, memberships: [] });
  await f.listener.handle(event, f.tx as never);
  await f.listener.handle(event, f.tx as never);
  expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
  f.notifications.createOccurrence.mockRejectedValue(new Error('DB failed'));
  await expect(f.listener.handle(event, f.tx as never)).rejects.toThrow('DB failed');
});
it('preserves transactional channels and payload on a duplicate without opening another transaction', async () => {
  const tx = { notification: { upsert: jest.fn().mockResolvedValue({ id: 'existing' }) } };
  const prisma = { $transaction: jest.fn() };
  const repo = new NotificationsRepository(prisma as never);
  const input = {
    type: 'tenant.created',
    recipientType: 'USER' as const,
    recipientId: 'owner',
    tenantId: 'tenant',
    occurrenceKey: 'tenant:onboarding.completed:owner',
    expiresAt: new Date('2026-10-17T02:00Z'),
    payload: {},
  };
  await repo.createOccurrence(input, ['IN_APP', 'EMAIL'], tx as never);
  expect(tx.notification.upsert).toHaveBeenCalledWith({
    where: { occurrenceKey: input.occurrenceKey },
    create: { ...input, deliveries: { create: [{ channel: 'IN_APP' }, { channel: 'EMAIL' }] } },
    update: {},
  });
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it('does not start a worker before commit and retains immediate processing for normal occurrences', async () => {
  const events = { emit: jest.fn() };
  const repo = { createOccurrence: jest.fn().mockResolvedValue({ id: 'notification' }) };
  const service = new NotificationsService(
    events as never,
    new NotificationConfigService(),
    repo as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const input = {
    type: 'tenant.created',
    recipientType: 'USER' as const,
    recipientId: 'owner',
    tenantId: 'tenant',
    occurrenceKey: 'key',
    expiresAt: new Date('2026-10-17T02:00Z'),
    payload: {},
  };
  const tx = { transaction: true };
  await service.createOccurrence(input, tx as never);
  expect(events.emit).not.toHaveBeenCalled();
  expect(repo.createOccurrence).toHaveBeenCalledWith(input, ['IN_APP', 'EMAIL'], tx);
  await service.createOccurrence(input);
  expect(events.emit).toHaveBeenCalledWith('notification.process', 'notification');
});
it('keeps the dashboard action in email and greets in-app without a redundant action', () => {
  const template = new TenantCreatedTemplate();
  const v = { tenantName: tenant.name, businessPath: '/salon', businessUrl: 'https://app.example.com/salon' };
  const html = renderToStaticMarkup((template.build('EMAIL', v) as BuildEmailResponse).react);
  expect(html).toContain('Salón &lt;script&gt;');
  expect(html).toContain('Ir a mi negocio');
  expect(html).toContain('¡Bienvenido a Bookify!');
  expect(html).toContain('Tu negocio ya está listo. Entrá y empezá a organizar tu agenda y gestionar tus citas desde un solo lugar.');
  expect((template.build('EMAIL', v) as BuildEmailResponse).subject).toBe('¡Bienvenido a Bookify!');
  expect(html).not.toMatch(/reservas online|Cancelar cita|Reprogramar cita/);
  expect(template.build('IN_APP', v)).toEqual({
    title: '¡Bienvenido a Bookify!',
    message: 'Qué bueno tenerte acá. Todo listo para empezar a gestionar tu agenda y tus citas.',
  });
  const legacy = template.build('IN_APP', { tenantName: 'Legacy', userName: 'Owner' });
  expect(legacy.title).toBe('¡Bienvenido a Bookify!');
  expect(legacy).not.toHaveProperty('action');
  const unsafe = renderToStaticMarkup((template.build('EMAIL', { ...v, businessUrl: 'javascript:alert(1)' }) as BuildEmailResponse).react);
  expect(unsafe).not.toContain('href="javascript:');
  expect(() => template.build('WHATSAPP', v)).toThrow();
});
it('does not reserve business email quota for the reused notification type', async () => {
  const prisma = { $transaction: jest.fn() };
  const service = new NotificationUsageService(prisma as never, new NotificationConfigService(), {} as never);
  expect(
    await service.reserve({
      channel: 'EMAIL',
      notification: { type: 'tenant.created', tenantId: 'tenant', recipientType: 'USER' },
    } as never),
  ).toBe(true);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
