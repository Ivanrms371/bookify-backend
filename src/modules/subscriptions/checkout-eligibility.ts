import type { Subscription } from 'src/generated/prisma/client';
import type { BillingCycle, Plan, WorkspaceType } from './plans.config';
import type { CheckoutEligibilityDto } from './dto/checkout.dto';

type CheckoutSubscription = Pick<Subscription, 'planId' | 'status' | 'deletedAt' | 'lemonSubscriptionId' | 'endsAt' | 'trialEndsAt'>;
interface CheckoutEligibilityContext {
  plan: Plan;
  cycle: BillingCycle;
  workspaceType: WorkspaceType | null;
  subscription: CheckoutSubscription | null;
  professionals: number;
}

const LIVE_PAID_STATUSES = ['ACTIVE', 'PAST_DUE', 'PAUSED', 'SUSPENDED', 'PENDING_PAYMENT'];

function hasPaidSubscription(subscription: CheckoutSubscription | null, now: Date): boolean {
  if (!subscription || subscription.planId === 'free') return false;
  if (LIVE_PAID_STATUSES.includes(subscription.status)) return true;
  const ended =
    subscription.status === 'EXPIRED' ||
    (subscription.status === 'CANCELLED' && subscription.endsAt !== null && subscription.endsAt <= now);
  return Boolean(subscription.lemonSubscriptionId && !ended);
}

export function getCheckoutEligibility(
  { plan, cycle, workspaceType, subscription, professionals }: CheckoutEligibilityContext,
  now = new Date(),
): CheckoutEligibilityDto {
  const blockers: CheckoutEligibilityDto['blockers'] = [];
  if (!subscription || subscription.deletedAt) {
    blockers.push({ code: 'SUBSCRIPTION_REQUIRED', message: 'No encontramos la suscripción de este negocio.' });
  }
  if (plan.id === 'free') {
    blockers.push({ code: 'PLAN_UNAVAILABLE', message: 'La selección del plan Free estará disponible próximamente.' });
  }
  if (!workspaceType || !plan.compatibleWorkspaces.includes(workspaceType)) {
    blockers.push({ code: 'PLAN_INCOMPATIBLE', resource: 'workspace', message: 'Este plan no es compatible con el tipo de tu negocio.' });
  }
  const price = plan.pricing[cycle];
  if (!price) {
    blockers.push({ code: 'INVALID_BILLING_CYCLE', resource: 'cycle', message: 'Este ciclo de facturación no está disponible.' });
  } else if (plan.id !== 'free' && !price.lemonVariantId) {
    blockers.push({ code: 'PLAN_UNAVAILABLE', resource: 'provider', message: 'Este plan todavía no está disponible para pagar.' });
  }
  const excess = professionals - plan.maxProfessionals;
  if (excess > 0) {
    blockers.push({
      code: 'PLAN_LIMIT_REACHED',
      resource: 'professionals',
      used: professionals,
      limit: plan.maxProfessionals,
      excess,
      message: `Este plan permite ${plan.maxProfessionals} profesionales. Tienes ${professionals}. Elimina ${excess} para continuar.`,
    });
  }
  if (hasPaidSubscription(subscription, now)) {
    blockers.push({
      code: 'SUBSCRIPTION_ALREADY_EXISTS',
      message: 'Ya tienes una suscripción de pago. Los cambios de plan estarán disponibles próximamente.',
    });
  }
  // Trial charge timing remains a product decision; do not charge a running trial.
  if (subscription?.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt > now) {
    blockers.push({ code: 'TRIAL_PAYMENT_POLICY_PENDING', message: 'Podrás pagar cuando termine tu prueba gratuita.' });
  }
  return { eligible: blockers.length === 0, blockers };
}
