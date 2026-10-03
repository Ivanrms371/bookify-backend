import type {
  PlanChangeEligibilityContext,
  PlanChangeEligibilityDto,
  PlanSelection,
  SubscriptionPlanState,
} from './types/plan-change.types';
import { isPendingScheduledChange, planRank } from './plan-change';

function hasActiveProviderSubscription(local: SubscriptionPlanState): boolean {
  return (
    !local.deletedAt &&
    local.status === 'ACTIVE' &&
    local.paymentProvider === 'LEMON_SQUEEZY' &&
    Boolean(local.lemonSubscriptionId && local.lemonCustomerId)
  );
}

function getChangeKind(local: SubscriptionPlanState, selection: PlanSelection, undo: boolean): PlanChangeEligibilityDto['kind'] {
  if (undo) {
    return 'undo';
  }
  if (selection.planId === local.planId) {
    return selection.cycle === local.billingCycle ? null : 'cycle';
  }
  return planRank(selection.planId) > planRank(local.planId) ? 'upgrade' : 'downgrade';
}

export function getPlanChangeEligibility(
  { local, selection, target, tenant, usage }: PlanChangeEligibilityContext,
  now = new Date(),
): PlanChangeEligibilityDto {
  const blockers: PlanChangeEligibilityDto['blockers'] = [];
  if (!hasActiveProviderSubscription(local)) {
    blockers.push({ code: 'PLAN_CHANGE_UNAVAILABLE', message: 'Necesitas una suscripción de pago activa para cambiar de plan.' });
  }
  if (selection.cycle !== local.billingCycle && selection.planId !== local.planId) {
    blockers.push({
      code: 'COMBINED_PLAN_CYCLE_CHANGE_UNAVAILABLE',
      resource: 'cycle',
      message: 'Cambia el plan y el ciclo de pago por separado.',
    });
  }
  if (target.id === 'free' || !target.pricing[selection.cycle]?.lemonVariantId) {
    blockers.push({ code: 'PLAN_UNAVAILABLE', resource: 'provider', message: 'Este plan no está disponible para este cambio.' });
  }
  if (!tenant.workspaceType || !target.compatibleWorkspaces.includes(tenant.workspaceType)) {
    blockers.push({ code: 'PLAN_INCOMPATIBLE', resource: 'workspace', message: 'Este plan no es compatible con tu negocio.' });
  }
  const undo = isPendingScheduledChange(local) && selection.planId === local.planId && selection.cycle === local.billingCycle;
  if (local.pendingPlanId && !undo) {
    blockers.push({
      code: 'PLAN_CHANGE_PENDING',
      message: 'Ya tienes un cambio pendiente. Actualiza su estado o cancela la reducción programada.',
    });
  }
  if (!local.pendingPlanId && selection.planId === local.planId && selection.cycle === local.billingCycle) {
    blockers.push({ code: 'PLAN_ALREADY_SELECTED', message: 'Ya tienes este plan.' });
  }
  if (!local.currentPeriodEnd || local.currentPeriodEnd <= now) {
    blockers.push({ code: 'PLAN_PERIOD_UNCONFIRMED', message: 'Esperamos la confirmación del período de pago actual.' });
  }
  for (const [resource, limit] of [
    ['professionals', target.maxProfessionals],
    ['services', target.maxServices],
  ] as const) {
    if (selection.planId !== local.planId && usage[resource] > limit) {
      blockers.push({
        code: 'PLAN_LIMIT_REACHED',
        resource,
        used: usage[resource],
        limit,
        excess: usage[resource] - limit,
        message: `El plan permite ${limit} ${resource === 'professionals' ? 'profesionales' : 'servicios'}. Elimina ${usage[resource] - limit} para continuar.`,
      });
    }
  }
  const kind = getChangeKind(local, selection, undo);
  return {
    eligible: blockers.length === 0,
    blockers,
    kind,
    chargeImmediately: kind === 'upgrade',
    effectiveAt: kind === 'downgrade' || kind === 'cycle' ? (local.currentPeriodEnd?.toISOString() ?? null) : null,
  };
}
