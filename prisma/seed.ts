import { PrismaClient, PlanType, BillingCycle } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { seedPlans } from './seeds/plans';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: pool });

/* 
export const ONBOARDING_PLANS: OnboardingPlan[] = [
  {
    id: 'FREE',
    name: 'Free',
    description: 'Perfecto para empezar y probar la plataforma.',
    price: 0,
    features: [
      { text: '1 profesional' },
      { text: 'Reservas ilimitadas' },
      { text: 'Estadísticas básicas' },
      { text: 'Página de reservas' },
    ],
    buttonText: 'Comenzar con Free',
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: 'Para barberías establecidas que buscan crecer.',
    price: 590,
    isPopular: true,
    features: [
      { text: 'Todo lo del plan Free' },
      { text: 'Recordatorios automáticos' },
      { text: 'Estadísticas avanzadas' },
      { text: 'Soporte prioritario' },
    ],
    buttonText: 'Comenzar con Pro',
  },
  {
    id: 'TEAM',
    name: 'Team',
    description: 'La solución completa para equipos de profesionales.',
    price: 1190,
    features: [
      { text: 'Todo lo del plan Pro' },
      { text: 'Hasta 5 Profesionales' },
      { text: 'Gestión de profesionales' },
      { text: 'Reportes avanzados' },
    ],
    buttonText: 'Comenzar con Team',
  },
];
*/

async function main() {
  console.log('🌱 Seeding database...');

  await seedPlans(prisma);

  console.log('✅ Seeding finished');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
