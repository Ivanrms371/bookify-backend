import { Prisma } from 'src/generated/prisma/client';
import type { ProfessionalDayOutcomes } from '../types/professional-summary.type';

export function summarizeProfessionalDay(groups: ProfessionalDayOutcomes) {
  let completedCount = 0;
  let cancelledCount = 0;
  let noShowCount = 0;
  let unresolvedCount = 0;
  let totalCount = 0;
  let completedValue = new Prisma.Decimal(0);
  let latestEnd: Date | null = null;
  for (const group of groups) {
    const count = group._count._all;
    totalCount += count;
    if (group.status === 'COMPLETED') {
      completedCount += count;
      completedValue = completedValue.plus(group._sum.price ?? 0).minus(group._sum.discountAmount ?? 0);
    }
    if (group.status === 'CANCELLED') cancelledCount += count;
    if (group.status === 'NO_SHOW') noShowCount += count;
    if (group.status === 'PENDING' || group.status === 'CONFIRMED') unresolvedCount += count;
    // Cancelled appointments do not keep a workday open.
    if (group.status !== 'CANCELLED' && group._max.endsAt && (!latestEnd || group._max.endsAt > latestEnd)) latestEnd = group._max.endsAt;
  }
  return { completedCount, cancelledCount, noShowCount, unresolvedCount, totalCount, completedValue: completedValue.toFixed(2), latestEnd };
}
