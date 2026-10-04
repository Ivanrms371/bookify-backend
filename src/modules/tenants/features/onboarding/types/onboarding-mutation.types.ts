import type { Tenant } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
export type OnboardingMutation = (tenant: Tenant, tx: TransactionClient) => Promise<void>;
