import { SubscriptionStatus } from 'src/generated/prisma/enums';

export function isChurnStatus(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.CANCELLED || status === SubscriptionStatus.EXPIRED;
}
