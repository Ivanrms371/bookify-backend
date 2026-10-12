import { parseArgs } from 'node:util';
import type { ReconciliationCommand } from '../types/notification-reconciliation.type';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseReconciliationCommand(args: string[]): ReconciliationCommand {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      tenant: { type: 'string' },
      delivery: { type: 'string' },
      after: { type: 'string' },
      limit: { type: 'string' },
      outcome: { type: 'string' },
      'provider-id': { type: 'string' },
      operator: { type: 'string' },
      evidence: { type: 'string' },
      'workers-stopped': { type: 'boolean' },
    },
  });

  const command = positionals[0];
  if (positionals.length !== 1 || !['list', 'inspect', 'resolve'].includes(command)) throw new Error('Expected list, inspect or resolve');
  if (!values.tenant || !uuid.test(values.tenant)) throw new Error('--tenant must be a UUID');
  if (values.after && !uuid.test(values.after)) throw new Error('--after must be a UUID');
  if (command !== 'list' && (!values.delivery || !uuid.test(values.delivery))) throw new Error('--delivery must be a UUID');
  const limit = values.limit === undefined ? 50 : Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('--limit must be between 1 and 100');
  const result: ReconciliationCommand = {
    command: command as ReconciliationCommand['command'],
    tenantId: values.tenant,
    deliveryId: values.delivery,
    limit,
    after: values.after,
  };
  if (command === 'resolve') {
    if (!values['workers-stopped']) throw new Error('Stop all notification workers and reconciliation crons, then pass --workers-stopped');
    if (!['accepted', 'not-accepted'].includes(values.outcome ?? '')) throw new Error('--outcome must be accepted or not-accepted');
    if (!values.operator?.trim() || !values.evidence?.trim()) throw new Error('--operator and --evidence are required');
    if (values.outcome === 'accepted' && !values['provider-id']?.trim()) throw new Error('--provider-id is required for accepted');
    if (values.outcome === 'not-accepted' && values['provider-id']) throw new Error('Provider acceptance ID contradicts not-accepted');
    result.resolution = {
      deliveryId: values.delivery!,
      tenantId: values.tenant,
      source: 'manual',
      outcome: values.outcome as 'accepted' | 'not-accepted',
      providerId: values['provider-id'],
      operator: values.operator.trim(),
      evidence: values.evidence.trim(),
    };
  }
  return result;
}
