import type { Customer, Subscription } from 'src/generated/prisma/client';
import { getSubscriptionAccess } from 'src/modules/subscriptions/subscription-access';

export function requiresCustomerVerification(subscription: Subscription | null, now = new Date()): boolean {
  const access = getSubscriptionAccess(subscription, false, now);
  return access.state === 'enabled' && ['pro', 'pro_plus'].includes(access.effectivePlanId ?? '');
}

export function hasVerifiedCustomerEmail(customer: Customer): boolean {
  return !!(customer.email?.trim() && customer.emailVerifiedAt);
}

export function customerDestination(customer: Customer, channel: string): string | null {
  if (channel === 'EMAIL') return customer.email?.trim().toLowerCase() || null;
  if (channel === 'WHATSAPP' && customer.phoneCountryCode && customer.phoneNumber) {
    return `+${`${customer.phoneCountryCode}${customer.phoneNumber}`.replace(/\D/g, '')}`;
  }
  return null;
}
