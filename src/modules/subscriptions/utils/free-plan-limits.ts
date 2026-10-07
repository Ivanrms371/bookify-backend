import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { lockBilling } from 'src/common/database/billing-lock';
import { FreePlanLimitException } from '../exceptions/free-plan-limit.exception';

export async function verifyFreeResourceAddition(
  tx: TransactionClient,
  tenantId: string,
  resource: 'professionals' | 'services',
  addition = 1,
) {
  await lockBilling(tx);
  const subscription = await tx.subscription.findUnique({ where: { tenantId } });
  if (!subscription || subscription.deletedAt || (subscription.planId !== 'free' && subscription.pendingPlanId !== 'free')) return;
  const limit = resource === 'professionals' ? 1 : 10;
  const where = { tenantId, deletedAt: null };
  const used = resource === 'professionals' ? await tx.professional.count({ where }) : await tx.service.count({ where });
  if (used + addition > limit) throw new FreePlanLimitException(resource, used, limit);
}
