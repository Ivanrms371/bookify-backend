import { PrismaClient } from 'src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedPlans } from './plans.seed';
import { seedBarberiaElCorte } from './businesses/barberia-el-corte.seed';
import { seedSalonBellaVita } from './businesses/salon-bella-vita.seed';
import { seedZenSpaWellness } from './businesses/zen-spa-wellness.seed';

export async function runSeeds(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Plans
  const plans = await seedPlans(prisma);
  console.log('  ✅ Plans created');

  // 2. Context shared across all business seeds
  const ctx = { prisma, passwordHash, plans };

  // 3. Businesses
  await seedBarberiaElCorte(ctx);
  console.log('  ✅ Barbería El Corte (Free)');

  await seedSalonBellaVita(ctx);
  console.log('  ✅ Salón Bella Vita (Pro/Trial)');

  await seedZenSpaWellness(ctx);
  console.log('  ✅ Zen Spa & Wellness (Team/Active)');

  // Summary
  console.log('');
  console.log('📊 Summary:');
  console.log('   3 Plans (Free, Pro, Team)');
  console.log('   6 Users (3 owners + 3 staff)');
  console.log('   3 Businesses:');
  console.log('     • Barbería El Corte (Free) — 1 staff, 3 services, 3 customers, 3 citas');
  console.log('     • Salón Bella Vita (Pro/Trial) — 2 staff, 4 services, 4 customers, 4 citas');
  console.log('     • Zen Spa & Wellness (Team/Active) — 3 staff, 5 services, 5 customers, 5 citas');
  console.log('   3 Subscriptions (Free, Pro Trial, Team Active)');
  console.log('   6 Staff members with lifetime stats');
  console.log('   12 Services with assignments');
  console.log('   12 Customers');
  console.log('   12 Appointments for tomorrow with blocks');
  console.log('   36 Working hours schedules');
  console.log('   4 Schedule exceptions');
  console.log('   3 Business settings + limits + lifetime stats');
  console.log('   9 Business members');
}
