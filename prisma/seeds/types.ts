import { PrismaClient } from 'src/generated/prisma/client';

export interface SeedPlans {
  free: { id: string };
  pro: { id: string };
  team: { id: string };
}

export interface SeedContext {
  prisma: PrismaClient;
  passwordHash: string;
  plans: SeedPlans;
}
