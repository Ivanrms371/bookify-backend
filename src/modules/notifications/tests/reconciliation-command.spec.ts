import { parseReconciliationCommand } from '../cli/reconciliation-command';
const tenant = '11111111-1111-4111-8111-111111111111';
const delivery = '22222222-2222-4222-8222-222222222222';
const resolve = [
  'resolve',
  '--tenant',
  tenant,
  '--delivery',
  delivery,
  '--workers-stopped',
  '--operator',
  'ivan',
  '--evidence',
  'support ticket 123',
];
it('parses bounded tenant-scoped list and inspect commands without a provider credential', () => {
  expect(parseReconciliationCommand(['list', '--tenant', tenant])).toMatchObject({ command: 'list', tenantId: tenant, limit: 50 });
  expect(parseReconciliationCommand(['inspect', '--tenant', tenant, '--delivery', delivery])).toMatchObject({ deliveryId: delivery });
});
it('requires provider ID for acceptance and records manual evidence and operator', () => {
  expect(parseReconciliationCommand([...resolve, '--outcome', 'accepted', '--provider-id', 'resend-id']).resolution).toEqual({
    deliveryId: delivery,
    tenantId: tenant,
    source: 'manual',
    outcome: 'accepted',
    providerId: 'resend-id',
    operator: 'ivan',
    evidence: 'support ticket 123',
  });
  expect(parseReconciliationCommand([...resolve, '--outcome', 'not-accepted']).resolution?.outcome).toBe('not-accepted');
});
it.each([
  ['list'],
  ['list', '--tenant', 'invalid'],
  ['list', '--tenant', tenant, '--limit', '1000'],
  ['list', '--tenant', tenant, '--after', 'invalid'],
  ['inspect', '--tenant', tenant],
  ['resolve', '--tenant', tenant, '--delivery', delivery, '--outcome', 'not-accepted'],
  [...resolve, '--outcome', 'unknown'],
  [...resolve, '--outcome', 'accepted'],
  [...resolve, '--outcome', 'not-accepted', '--provider-id', 'known'],
  [...resolve.filter((v) => v !== '--workers-stopped'), '--outcome', 'not-accepted'],
  [...resolve, '--outcome', 'not-accepted', '--operator', ' '],
  ['list', '--tenant', tenant, '--unsafe'],
])('rejects invalid or unsafe command %s', (...args) => {
  expect(() => parseReconciliationCommand(args)).toThrow();
});
