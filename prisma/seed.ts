import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { runSeeds } from './seeds';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
  console.log('🌱 Starting seed...');
  console.log('');
  try {
    await runSeeds(prisma);
    console.log('');
    console.log('✅ Seed data created successfully!');
  } catch (error) {
    console.error('❌ Error executing seeds:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
