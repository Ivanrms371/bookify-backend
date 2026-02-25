import { Decimal } from '@prisma/client/runtime/client';
import { PlanType, PrismaClient } from 'src/generated/prisma/client';
import { SeedPlans } from './types';

export async function seedPlans(prisma: PrismaClient): Promise<SeedPlans> {
  const free = await prisma.plan.create({
    data: {
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
      limits: {
        create: {
          appointmentLimit: -1,
          emailLimit: 0,
          professionalLimit: 1,
          whatsappLimit: 0,
        },
      },
    },
  });

  const pro = await prisma.plan.create({
    data: {
      name: 'Pro',
      planType: PlanType.PRO,
      description: 'Perfecto para trabajadores individuales',
      price: new Decimal(590),
      currency: 'UYU',
      trialDays: 14,
      isActive: true,
      isPublic: true,
      duration: 30,
      features: [],
      limits: {
        create: {
          appointmentLimit: -1,
          emailLimit: 500,
          professionalLimit: 1,
          whatsappLimit: 300,
        },
      },
    },
  });

  const team = await prisma.plan.create({
    data: {
      name: 'Team',
      planType: PlanType.TEAM,
      description: 'Perfecto para equipos',
      price: new Decimal(1190),
      currency: 'UYU',
      trialDays: 14,
      isActive: true,
      isPublic: true,
      duration: 30,
      features: [],
      limits: {
        create: {
          appointmentLimit: -1,
          emailLimit: 1500,
          professionalLimit: 5,
          whatsappLimit: 1200,
        },
      },
    },
  });

  return { free, pro, team };
}
