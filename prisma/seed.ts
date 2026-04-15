import { PrismaClient, PlanType, BillingCycle } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  console.log('Seeding plans...');

  const plans = [
    {
      name: 'Plan Gratis',
      planType: PlanType.FREE,
      price: 0,
      trialDays: 14,
      duration: 30,
      billingCycle: BillingCycle.MONTHLY,
      limits: {
        appointmentLimit: -1,
        emailLimit: 0,
        professionalLimit: 1,
        whatsappLimit: 0,
      },
    },
    {
      name: 'Plan Profesional',
      planType: PlanType.PRO,
      price: 590,
      trialDays: 14,
      duration: 30,
      billingCycle: BillingCycle.MONTHLY,
      limits: {
        appointmentLimit: -1,
        emailLimit: 500,
        professionalLimit: 5,
        whatsappLimit: 300,
      },
    },
    {
      name: 'Plan Equipo',
      planType: PlanType.TEAM,
      price: 1190,
      trialDays: 14,
      duration: 30,
      billingCycle: BillingCycle.MONTHLY,
      limits: {
        appointmentLimit: -1,
        emailLimit: 1500,
        professionalLimit: 20,
        whatsappLimit: 1200,
      },
    },
  ];

  for (const planData of plans) {
    const { limits, ...planBase } = planData;
    
    console.log(`Upserting plan: ${planBase.planType}`);
    
    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { externalReference: planBase.planType },
    });

    if (existingPlan) {
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          ...planBase,
          limits: {
            update: limits,
          },
        },
      });
    } else {
      await prisma.plan.create({
        data: {
          ...planBase,
          externalReference: planBase.planType,
          limits: {
            create: limits,
          },
        },
      });
    }
  }

  console.log('Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
