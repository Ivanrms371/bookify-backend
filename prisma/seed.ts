import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { assertDevelopmentEnvironment, seedDevelopment } from './development/development';
import { DEVELOPMENT_PASSWORD, PROFESSIONALS, SLUG } from './development/fixtures';

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

async function main() {
  assertDevelopmentEnvironment(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const days = await seedDevelopment(prisma);
    console.log(`Development tenant: ${SLUG}`);
    console.table(days);
    console.log('Development logins (demo accounts recreated):');
    for (const professional of PROFESSIONALS) console.log(`  ${professional.email}`);
    console.log(`Initial development password: ${DEVELOPMENT_PASSWORD}`);
    console.log(`Public business path: /b/${SLUG}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Do not dump the adapter/configuration or a connection URL on failure.
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Development seed failed:', message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[database URL redacted]'));
  process.exitCode = 1;
});
