import 'dotenv/config';
import 'reflect-metadata';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotificationConfigService } from '../notification-config.service';
import { NotificationFinalizationService } from '../application/services/notification-finalization.service';
import { NotificationReconciliationRepository } from '../infraestructure/repositories/notification-reconciliation.repository';
import { ReconciliationConflictError } from '../errors/reconciliation-conflict.error';
import { parseReconciliationCommand } from './reconciliation-command';

// Standalone: never import AppModule, schedulers, gateways or provider SDKs.
export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'Usage: pnpm notifications:reconcile <list|inspect|resolve> --tenant <uuid>\n' +
        '  list: [--limit 1..100] [--after <uuid>]\n' +
        '  inspect: --delivery <uuid>\n' +
        '  resolve: --delivery <uuid> --outcome <accepted|not-accepted> --operator <name> --evidence <reference>\n' +
        '           --workers-stopped [--provider-id <Resend email ID, required for accepted>]',
    );
    return;
  }
  // Validate before creating any database connection.
  const input = parseReconciliationCommand(args);
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const repository = new NotificationReconciliationRepository(prisma);
    if (input.command === 'list') {
      const rows = await repository.list(input.tenantId, new Date(Date.now() - 15 * 60_000), input.limit, input.after);
      console.log(JSON.stringify({ deliveries: rows, after: rows.length === input.limit ? rows.at(-1)!.id : null }, null, 2));
    } else if (input.command === 'inspect') {
      const row = await repository.inspect(input.tenantId, input.deliveryId!);
      if (!row) throw new ReconciliationConflictError('Email delivery not found in tenant');
      console.log(JSON.stringify(row, null, 2));
    } else {
      const finalization = new NotificationFinalizationService(prisma, new NotificationConfigService());
      console.log(JSON.stringify(await finalization.resolve(input.resolution!), null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      error instanceof ReconciliationConflictError
        ? error.message
        : 'Reconciliation command failed. Check arguments, database availability and pending migrations.',
    );
    process.exitCode = 1;
  });
}
