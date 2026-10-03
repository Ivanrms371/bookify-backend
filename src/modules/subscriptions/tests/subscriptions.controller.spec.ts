import type { SubscriptionsService } from '../subscriptions.service';
import type { SubscriptionWebhookService } from '../subscription-webhook.service';
import { IS_PUBLIC_KEY } from 'src/common/security/decorators/public.decorator';
import type { PlanChangeService } from '../plan-change.service';
import { SubscriptionsController } from '../subscriptions.controller';
import { PermissionsGuard } from 'src/common/security/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';

// Exercise the real permissions metadata and guard, after auth/tenant membership guards.
describe('subscription read permissions', () => {
  const guard = new PermissionsGuard(new Reflector());
  const context = (handler: keyof SubscriptionsController, role: keyof typeof ROLE_PERMISSIONS) =>
    ({
      getHandler: () => SubscriptionsController.prototype[handler],
      getClass: () => SubscriptionsController,
      switchToHttp: () => ({ getRequest: () => ({ tenantContext: { permissions: ROLE_PERMISSIONS[role] } }) }),
    }) as unknown as ExecutionContext;
  it('limits financial summary to owners', () => {
    expect(guard.canActivate(context('getCurrentSubscription', 'OWNER'))).toBe(true);
    expect(() => guard.canActivate(context('getCurrentSubscription', 'STAFF'))).toThrow();
    expect(() => guard.canActivate(context('getCurrentSubscription', 'ADMIN'))).toThrow();
  });
  it('allows only owners to create checkout or inspect eligibility', () => {
    for (const method of [
      'createCheckout',
      'getEligibility',
      'getChangeEligibility',
      'changePlan',
      'cancelPlanChange',
      'refreshPlanChange',
    ] as const) {
      expect(guard.canActivate(context(method, 'OWNER'))).toBe(true);
      expect(() => guard.canActivate(context(method, 'ADMIN'))).toThrow();
      expect(() => guard.canActivate(context(method, 'STAFF'))).toThrow();
    }
  });
  it('makes only the signed webhook public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, SubscriptionsController.prototype.handleWebhook)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, SubscriptionsController.prototype.createCheckout)).toBeUndefined();
  });
  it('allows safe catalog and access projections for any authenticated tenant member', () => {
    expect(guard.canActivate(context('getPlans', 'STAFF'))).toBe(true);
    expect(guard.canActivate(context('getAccess', 'ADMIN'))).toBe(true);
  });
  it('delegates verified raw webhook processing to the dedicated webhook service', async () => {
    const webhook = { handleWebhook: jest.fn().mockResolvedValue(undefined) };
    const controller = new SubscriptionsController(
      {} as SubscriptionsService,
      webhook as unknown as SubscriptionWebhookService,
      {} as PlanChangeService,
    );
    const rawBody = Buffer.from('{"signed":"payload"}');
    expect(await controller.handleWebhook(rawBody, 'signature')).toEqual({ received: true });
    expect(webhook.handleWebhook).toHaveBeenCalledWith(rawBody, 'signature');
  });
});
