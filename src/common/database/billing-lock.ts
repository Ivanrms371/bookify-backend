import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

export function lockBilling(tx: TransactionClient) {
  return tx.$executeRaw`SELECT pg_advisory_xact_lock(73124, 1)`;
}
