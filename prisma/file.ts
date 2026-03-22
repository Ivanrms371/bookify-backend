import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { runSeeds } from './seeds';

const adapter = new PrismaPg({ connectionString: 'postgresql://postgres:postgres@localhost:5433/turnify_db' });
const prisma = new PrismaClient({ adapter });

(async () => {
  console.log(' Starting chart...');
  try {
    const business = await prisma.business.findUnique({
      where: { slug: 'barber-studio' },
    });

    if (!business) return;

    const days = 30;
    const data: any = [];

    let totalCustomers = 100;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulación
      const cuts = Math.floor(Math.random() * 10) + 5; // 5 - 15 cortes
      const dyes = Math.floor(Math.random() * 5) + 1; // 1 - 5 tintes

      const appointmentsCount = cuts + dyes;

      const revenue = cuts * 350 + dyes * 1200;

      const newCustomers = Math.floor(Math.random() * 5) + 1;

      totalCustomers += newCustomers;

      data.push({
        businessId: business.id,
        date,
        appointments: appointmentsCount,
        revenue,
        customers: totalCustomers,
      });
    }

    await prisma.businessDailyStats.createMany({
      data,
    });
  } catch (error) {
    console.error('❌ Error executing seeds:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
