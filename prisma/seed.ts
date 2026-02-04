import { PrismaPg } from '@prisma/adapter-pg';
import { Decimal } from '@prisma/client/runtime/client';
import { Plan, PlanType, PrismaClient } from 'src/generated/prisma/client';
import { PlanCreateInput } from 'src/generated/prisma/models';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

async function main() {
  const plans: PlanCreateInput[] = [
    {
      id: 'free',
      name: 'Free',
      planType: PlanType.FREE,
      description: 'Perfecto para arrancar',
      price: new Decimal(0),
      currency: 'UYU',
      trialDays: 0,
      isActive: true,
      isPublic: true,
      duration: 0,
      features: [],
    },
    {
      id: 'pro',
      name: 'Pro',
      planType: PlanType.PRO,
      description: 'Perfecto para trabajadores individuales',
      price: new Decimal(590),
      currency: 'UYU',
      trialDays: 14,
      isActive: true,
      isPublic: true,
      duration: 0,
      features: [],
    },
    {
      id: 'team',
      name: 'Team',
      planType: PlanType.TEAM,
      description: 'Perfecto para equipos',
      price: new Decimal(1190),
      currency: 'UYU',
      trialDays: 14,
      isActive: true,
      isPublic: true,
      duration: 0,
      features: [],
    },
  ];

  await prisma.plan.createMany({ data: plans });
}

(async () => {
  console.log('Seeds started');
  try {
    await main();
    console.log('Seeds executed successfully');
  } catch (error) {
    console.error('Error executing seeds:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
