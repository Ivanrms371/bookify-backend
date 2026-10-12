/// <reference types="jest" />
import { DeliveryRejectedError } from '../errors/delivery-rejected.error';
import { Logger } from '@nestjs/common';
import { NotificationProcessorService } from '../application/services/notification-processor.service';
import { ConfigService } from '@nestjs/config';
import { NotificationGatewaysService } from '../infraestructure/gateways/notification-gateways.service';
import { NotificationRecipientResolver } from '../application/services/notification-recipient-resolver.service';
import { EmailGateway } from '../infraestructure/gateways/email.gateway';
import { InvitationCreatedListener } from '../listeners/invitations/invitation-created.listener';
import { InvitationCreatedEvent } from '../../tenants/events/invitation-created.event';
import type { Notification } from 'src/generated/prisma/client';

jest.mock('../application/services/in-app-notifications.service', () => ({ InAppNotificationsService: jest.fn() }));
jest.mock('../infraestructure/gateways/whatsapp.gateway', () => ({ WhatsappGateway: jest.fn() }));
jest.mock('../application/services/template.service', () => ({ TemplateService: jest.fn() }));
jest.mock('../application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));
const send = jest.fn();
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send } })) }));

const notification: Notification = {
  occurrenceKey: null,
  expiresAt: null,
  id: 'notification',
  tenantId: 'tenant',
  createdAt: new Date(),
  updatedAt: new Date(),
  referenceId: 'invitation-id',
  type: 'invitation.created',
  recipientId: 'invitation-id',
  recipientType: 'USER',
  payload: { email: 'new@example.com' },
};
const template = { subject: 'Invitation', react: null };
function gateway(environment: string) {
  const values = { RESEND_API_KEY: 'test', NODE_ENV: environment, RESEND_SANDBOX: 'sandbox@example.com' };
  const config = { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;
  const users = { findById: jest.fn().mockRejectedValue(new Error('No user exists')) };
  const emailGateway = new EmailGateway(config);
  const gateways = new NotificationGatewaysService(
    emailGateway,
    {} as never,
    {} as never,
    new NotificationRecipientResolver(users as never, {} as never, {} as never),
  );
  return {
    service: { send: (notification: Notification, template: any) => gateways.send('EMAIL', notification, template, 'delivery') },
    users,
  };
}

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: 'delivery-id' } });
});
it('registers server-generated invitation email for queued delivery', async () => {
  const notifications = { create: jest.fn().mockResolvedValue(notification) };
  const listener = new InvitationCreatedListener(notifications as never);
  await listener.handle(new InvitationCreatedEvent('tenant', 'invitation-id', 'new@example.com', 'token', 'STAFF', 'Business'));
  expect(notifications.create).toHaveBeenCalledWith(
    expect.objectContaining({
      recipientId: 'invitation-id',
      referenceId: 'invitation-id',
      payload: expect.objectContaining({ email: 'new@example.com', role: 'STAFF' }),
    }),
  );
});
it('sends to the invitation email without resolving an invitation ID as a user ID', async () => {
  const { service, users } = gateway('production');
  await expect(service.send(notification, template)).resolves.toBe('delivery-id');
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'new@example.com' }), {
    idempotencyKey: 'notification-delivery/delivery',
  });
  expect(users.findById).not.toHaveBeenCalled();
});
it('preserves the development sandbox recipient', async () => {
  const { service, users } = gateway('development');
  await service.send(notification, template);
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'sandbox@example.com' }), {
    idempotencyKey: 'notification-delivery/delivery',
  });
  expect(users.findById).not.toHaveBeenCalled();
});
it('reuses the delivery key across repeated provider requests', async () => {
  const { service } = gateway('production');
  await service.send(notification, template);
  await service.send(notification, template);
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0][1]).toEqual({ idempotencyKey: 'notification-delivery/delivery' });
  expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
});
it('propagates delivery failure to the existing processor retry mechanism', async () => {
  const { service } = gateway('production');
  send.mockResolvedValue({ data: null, error: 'failure' });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await expect(service.send(notification, template)).rejects.toThrow('sending email');
  } finally {
    log.mockRestore();
  }
});
it('does not silently fall back to a user lookup when the invitation email is missing', async () => {
  const { service, users } = gateway('production');
  await expect(service.send({ ...notification, payload: {} }, template)).rejects.toThrow('Invitation has no email');
  expect(send).not.toHaveBeenCalled();
  expect(users.findById).not.toHaveBeenCalled();
});

it('holds an uncertain email for reconciliation independently of professional creation', async () => {
  const { service } = gateway('production');
  send.mockRejectedValue(new Error('mail unavailable'));
  const deliveries = {
    claim: jest.fn().mockResolvedValue(true),
    findPendingByNotification: jest.fn().mockResolvedValue([{ id: 'delivery', notification, channel: 'EMAIL', retryCount: 0 }]),
    incrementRetries: jest.fn().mockResolvedValue(undefined),
    markAsFailed: jest.fn(),
    markAsSent: jest.fn(),
  };
  const logs = { createErrorLog: jest.fn().mockResolvedValue(undefined) };
  const config = {
    getRetryPolicy: jest.fn().mockReturnValue({ retryable: true, maxRetries: 3, backoffDelays: [60000] }),
    getChannelConfig: jest.fn().mockReturnValue({}),
  };
  const processor = new NotificationProcessorService(
    { reserve: jest.fn().mockResolvedValue(true), retain: jest.fn(), release: jest.fn() } as never,
    { build: jest.fn().mockReturnValue(template) } as never,
    {
      prepare: jest.fn().mockResolvedValue('new@example.com'),
      send: (_channel, value, emailTemplate) => service.send(value, emailTemplate),
    } as never,
    deliveries as never,
    logs as never,
    config as never,
    { recordAcceptance: jest.fn(), resolve: jest.fn() } as never,
  );
  const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  try {
    await processor.processNotification(notification.id);
  } finally {
    log.mockRestore();
  }
  expect(deliveries.incrementRetries).not.toHaveBeenCalled();
  expect(logs.createErrorLog).toHaveBeenCalledWith('delivery', expect.stringContaining('RECONCILIATION_REQUIRED'));
  expect(deliveries.markAsFailed).not.toHaveBeenCalled();
  expect(deliveries.markAsSent).not.toHaveBeenCalled();
});

it.each([400, 401, 403, 422, 429])('classifies explicit provider rejection %s as non-delivery', async (statusCode) => {
  const { service } = gateway('production');
  send.mockResolvedValue({ data: null, error: { statusCode } });
  const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  try {
    await expect(service.send(notification, template)).rejects.toBeInstanceOf(DeliveryRejectedError);
  } finally {
    log.mockRestore();
  }
});
it.each([408, 409, 500, undefined])('keeps provider result %s ambiguous', async (statusCode) => {
  const { service } = gateway('production');
  send.mockResolvedValue({ data: null, error: { statusCode } });
  const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  try {
    await expect(service.send(notification, template)).rejects.toThrow('Ambiguous result');
  } finally {
    log.mockRestore();
  }
});
