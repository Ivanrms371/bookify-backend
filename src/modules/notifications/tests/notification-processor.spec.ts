import { Logger } from '@nestjs/common';
import { NotificationProcessorService } from '../application/services/notification-processor.service';
import { NotificationConfigService } from '../notification-config.service';
import { DeliveryRejectedError } from '../errors/delivery-rejected.error';
import { DeliverySkippedError } from '../errors/delivery-skipped.error';
import { SimulatedDeliveryError } from '../errors/simulated-delivery.error';
import { NotImplementedError } from '../errors/not-implemented.error';

jest.mock('../application/services/template.service', () => ({ TemplateService: jest.fn() }));
jest.mock('../infraestructure/gateways/notification-gateways.service', () => ({ NotificationGatewaysService: jest.fn() }));
const delivery = {
  id: 'delivery',
  channel: 'EMAIL',
  retryCount: 0,
  notification: { id: 'notification', tenantId: 'tenant', type: 'appointment.created', recipientType: 'USER', payload: {} },
};
function setup() {
  let claimed = false;
  const repository = {
    findPendingByNotification: jest.fn().mockResolvedValue([delivery]),
    claim: jest.fn(async () => {
      if (claimed) return false;
      claimed = true;
      return true;
    }),
    markAsSent: jest.fn(),
    markAsExpired: jest.fn(),
    markAsFailed: jest.fn(),
    incrementRetries: jest.fn(),
    exists: jest.fn(),
    ensureFallback: jest.fn(),
    findMissedCustomerFallbacks: jest.fn().mockResolvedValue([]),
    findPendingToProcess: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  };
  const usage = { reserve: jest.fn().mockResolvedValue(true), confirm: jest.fn(), release: jest.fn(), retain: jest.fn() };
  const gateway = { prepare: jest.fn().mockResolvedValue('resolved@example.com'), send: jest.fn().mockResolvedValue('provider-id') };
  const logs = { createSuccessLog: jest.fn(), createErrorLog: jest.fn() };
  const templates = { build: jest.fn().mockReturnValue({}) };
  const finalization = { recordAcceptance: jest.fn(), resolve: jest.fn() };
  const processor = new NotificationProcessorService(
    usage as never,
    templates as never,
    gateway as never,
    repository as never,
    logs as never,
    new NotificationConfigService(),
    finalization as never,
  );
  return { processor, usage, repository, gateway, logs, templates, finalization };
}
beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());
it('only the worker winning the claim sends, reserves and confirms', async () => {
  const { processor, usage, gateway, finalization } = setup();
  await Promise.all([processor.processNotification('notification'), processor.processNotification('notification')]);
  expect(gateway.send).toHaveBeenCalledTimes(1);
  expect(usage.reserve).toHaveBeenCalledTimes(1);
  expect(finalization.recordAcceptance).toHaveBeenCalledWith('delivery', 'provider-id', 'tenant');
  expect(finalization.resolve).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryId: 'delivery', outcome: 'accepted', source: 'worker' }),
  );
  expect(finalization.recordAcceptance.mock.invocationCallOrder[0]).toBeLessThan(finalization.resolve.mock.invocationCallOrder[0]);
});
it('does not invoke a gateway when quota is denied', async () => {
  const { processor, usage, gateway, repository } = setup();
  usage.reserve.mockResolvedValue(false);
  await processor.processNotification('notification');
  expect(gateway.send).not.toHaveBeenCalled();
  expect(repository.markAsFailed).toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
});
it.each([new DeliveryRejectedError('rejected'), new NotImplementedError()])('releases known non-delivery: %s', async (error) => {
  const { processor, usage, gateway } = setup();
  gateway.send.mockRejectedValue(error);
  await processor.processNotification('notification');
  expect(usage.release).toHaveBeenCalledWith('delivery');
  expect(usage.retain).not.toHaveBeenCalled();
});
it('retains quota and the claim on ambiguous timeout without retry or fallback', async () => {
  const { processor, usage, gateway, repository } = setup();
  gateway.send.mockRejectedValue(new Error('timeout'));
  await processor.processNotification('notification');
  expect(usage.retain).toHaveBeenCalledWith('delivery');
  expect(usage.release).not.toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.markAsFailed).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});
it.each(['recordAcceptance', 'resolve'] as const)('never retries or releases after acceptance if %s fails', async (operation) => {
  const { processor, usage, repository, finalization } = setup();
  finalization[operation].mockRejectedValue(new Error('database unavailable') as never);
  await processor.processNotification('notification');
  expect(usage.release).not.toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.markAsFailed).not.toHaveBeenCalled();
});
it('does not reserve if template building fails before a send', async () => {
  const { processor, templates, usage, gateway } = setup();
  templates.build.mockImplementation(() => {
    throw new Error('bad template');
  });
  await processor.processNotification('notification');
  expect(usage.reserve).not.toHaveBeenCalled();
  expect(gateway.send).not.toHaveBeenCalled();
});

it('passes the delivery identity to the gateway', async () => {
  const { processor, gateway } = setup();
  await processor.processNotification('notification');
  expect(gateway.send).toHaveBeenCalledWith('EMAIL', delivery.notification, {}, 'delivery', 'resolved@example.com');
});
it('does not charge quota, retry or fall back for simulated WhatsApp', async () => {
  const { processor, gateway, repository, usage } = setup();
  repository.findPendingByNotification.mockResolvedValue([{ ...delivery, channel: 'WHATSAPP' }] as never);
  gateway.send.mockRejectedValue(new SimulatedDeliveryError());
  await processor.processNotification('notification');
  expect(usage.reserve).not.toHaveBeenCalled();
  expect(usage.confirm).not.toHaveBeenCalled();
  expect(repository.markAsFailed).toHaveBeenCalledWith('delivery', expect.stringContaining('SIMULATED'));
  expect(repository.markAsSent).not.toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

it('permanently skips an unavailable channel before reserving quota or calling the provider', async () => {
  const { processor, gateway, repository, usage, logs } = setup();
  gateway.prepare.mockRejectedValue(new DeliverySkippedError('Professional has no email'));
  await processor.processNotification('notification');
  expect(repository.markAsFailed).toHaveBeenCalledWith('delivery', 'SKIPPED: Professional has no email');
  expect(logs.createErrorLog).toHaveBeenCalledWith('delivery', 'SKIPPED: Professional has no email');
  expect(usage.reserve).not.toHaveBeenCalled();
  expect(usage.confirm).not.toHaveBeenCalled();
  expect(usage.retain).not.toHaveBeenCalled();
  expect(usage.release).toHaveBeenCalledWith('delivery');
  expect(gateway.send).not.toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});
it('continues processing the other channel when one recipient channel is unavailable', async () => {
  const { processor, gateway, repository, usage, finalization } = setup();
  repository.findPendingByNotification.mockResolvedValue([
    { ...delivery, id: 'email', channel: 'EMAIL' },
    { ...delivery, id: 'in-app', channel: 'IN_APP' },
  ] as never);
  repository.claim.mockResolvedValue(true);
  gateway.prepare.mockRejectedValueOnce(new DeliverySkippedError('Professional has no email')).mockResolvedValueOnce('linked-user');
  await processor.processNotification('notification');
  expect(repository.markAsFailed).toHaveBeenCalledWith('email', expect.stringContaining('SKIPPED'));
  expect(finalization.resolve).toHaveBeenCalledWith(expect.objectContaining({ deliveryId: 'in-app', providerId: 'provider-id' }));
  expect(usage.reserve).toHaveBeenCalledTimes(1);
});

it('passes the stored payload to templates without adding appointment rules in the worker', async () => {
  const { processor, repository, templates } = setup();
  const payload = { createdBy: 'CUSTOMER', audience: 'CUSTOMER', cancelUrl: 'cancel', rescheduleUrl: 'reschedule' };
  repository.findPendingByNotification.mockResolvedValue([{ ...delivery, notification: { ...delivery.notification, payload } }] as never);
  await processor.processNotification('notification');
  expect(templates.build).toHaveBeenCalledWith('appointment.created', 'EMAIL', payload);
  expect(templates.build.mock.calls[0][2]).toBe(payload);
});
it('uses the configured customer email fallback immediately when WhatsApp has no phone', async () => {
  const { processor, gateway, repository, usage, finalization } = setup();
  repository.findPendingByNotification.mockResolvedValue([
    {
      ...delivery,
      channel: 'WHATSAPP',
      notification: {
        ...delivery.notification,
        recipientType: 'CUSTOMER',
      },
    },
  ] as never);
  gateway.prepare.mockRejectedValue(new DeliverySkippedError('Recipient has no phone number'));
  await processor.processNotification('notification');
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.ensureFallback).toHaveBeenCalledWith('notification', 'EMAIL');
  expect(usage.reserve).not.toHaveBeenCalled();
  expect(gateway.send).not.toHaveBeenCalled();
});

it('cancels any expired notification before rendering, resolving recipients or consuming quota', async () => {
  const { processor, repository, gateway, templates, usage } = setup();
  repository.findPendingByNotification.mockResolvedValue([
    { ...delivery, notification: { ...delivery.notification, type: 'any.generic.type', expiresAt: new Date(0) } },
  ] as never);
  await processor.processNotification('notification');
  expect(repository.markAsExpired).toHaveBeenCalledWith('delivery');
  expect(templates.build).not.toHaveBeenCalled();
  expect(gateway.prepare).not.toHaveBeenCalled();
  expect(gateway.send).not.toHaveBeenCalled();
  expect(usage.reserve).not.toHaveBeenCalled();
  expect(repository.incrementRetries).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});
it('releases quota if the generic deadline passes during preparation', async () => {
  const { processor, repository, gateway, usage } = setup();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-09T11:00Z'));
  try {
    repository.findPendingByNotification.mockResolvedValue([
      { ...delivery, notification: { ...delivery.notification, expiresAt: new Date('2026-10-09T11:01Z') } },
    ] as never);
    usage.reserve.mockImplementation(async () => {
      jest.setSystemTime(new Date('2026-10-09T11:01Z'));
      return true;
    });
    await processor.processNotification('notification');
    expect(gateway.send).not.toHaveBeenCalled();
    expect(repository.markAsExpired).toHaveBeenCalledWith('delivery');
    expect(usage.release).toHaveBeenCalledWith('delivery');
  } finally {
    jest.useRealTimers();
  }
});

it.each([new DeliveryRejectedError('rejected'), new SimulatedDeliveryError()])(
  'customer phone OTP never falls back to email: %s',
  async (error) => {
    const f = setup();
    const otp = {
      ...delivery,
      channel: 'WHATSAPP',
      retryCount: 1,
      notification: { ...delivery.notification, type: 'customer.verification', recipientType: 'CUSTOMER', payload: { code: '123456' } },
    };
    f.repository.findPendingByNotification.mockResolvedValue([otp] as never);
    f.gateway.send.mockRejectedValue(error);
    await f.processor.processNotification('notification');
    expect(f.repository.ensureFallback).not.toHaveBeenCalled();
    expect(f.repository.markAsFailed).toHaveBeenCalled();
    expect(f.repository.create).not.toHaveBeenCalled();
  },
);
it('never falls back on ambiguous customer OTP delivery', async () => {
  const f = setup();
  f.repository.findPendingByNotification.mockResolvedValue([
    {
      ...delivery,
      channel: 'WHATSAPP',
      notification: { ...delivery.notification, type: 'customer.verification', recipientType: 'CUSTOMER' },
    },
  ] as never);
  f.gateway.send.mockRejectedValue(new Error('timeout'));
  await f.processor.processNotification('notification');
  expect(f.usage.retain).toHaveBeenCalled();
  expect(f.repository.ensureFallback).not.toHaveBeenCalled();
  expect(f.repository.markAsFailed).not.toHaveBeenCalled();
});
it('does not recover obsolete phone OTP email fallbacks', async () => {
  const f = setup();
  f.repository.findMissedCustomerFallbacks.mockResolvedValue([{ notificationId: 'notification' }] as never);
  await f.processor.processBatch();
  expect(f.repository.ensureFallback).not.toHaveBeenCalled();
});

it('falls back when WhatsApp quota is exhausted and returns to WhatsApp for the next notice', async () => {
  const { WhatsappGateway } = require('../infraestructure/gateways/whatsapp.gateway');
  jest.spyOn(WhatsappGateway, 'isOperational').mockReturnValue(true);
  const f = setup();
  const whatsapp = { ...delivery, channel: 'WHATSAPP', notification: { ...delivery.notification, recipientType: 'CUSTOMER' } };
  f.repository.findPendingByNotification.mockResolvedValue([whatsapp] as never);
  f.repository.claim.mockResolvedValue(true);
  f.usage.reserve.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  await f.processor.processNotification('notification');
  expect(f.repository.ensureFallback).toHaveBeenCalledWith('notification', 'EMAIL');
  expect(f.gateway.send).not.toHaveBeenCalled();
  const next = { ...whatsapp, id: 'next-delivery', notification: { ...whatsapp.notification, id: 'next-notification' } };
  f.repository.findPendingByNotification.mockResolvedValue([next] as never);
  await f.processor.processNotification('next-notification');
  expect(f.gateway.send).toHaveBeenCalledWith('WHATSAPP', next.notification, {}, 'next-delivery', 'resolved@example.com');
  expect(f.repository.ensureFallback).toHaveBeenCalledTimes(1);
});

it.each(['appointment.created', 'appointment.rescheduled', 'appointment.cancelled', 'appointment.reminder'])(
  'uses email for %s when the WhatsApp gateway is simulated',
  async (type) => {
    const f = setup();
    f.repository.findPendingByNotification.mockResolvedValue([
      { ...delivery, channel: 'WHATSAPP', notification: { ...delivery.notification, type, recipientType: 'CUSTOMER' } },
    ] as never);
    f.gateway.send.mockRejectedValue(new SimulatedDeliveryError());
    await f.processor.processNotification('notification');
    expect(f.repository.ensureFallback).toHaveBeenCalledWith('notification', 'EMAIL');
    expect(f.usage.reserve).not.toHaveBeenCalled();
  },
);
