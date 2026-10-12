const connect = jest.fn();
const disconnect = jest.fn();
const list = jest.fn();
const inspect = jest.fn();
const resolveDelivery = jest.fn();
const PrismaConstructor = jest.fn().mockImplementation(() => ({ $connect: connect, $disconnect: disconnect }));
jest.mock('src/shared/prisma/prisma.service', () => ({
  PrismaService: function () {
    return PrismaConstructor();
  },
}));
jest.mock('../infraestructure/repositories/notification-reconciliation.repository', () => ({
  NotificationReconciliationRepository: jest.fn().mockImplementation(() => ({ list, inspect })),
}));
jest.mock('../application/services/notification-finalization.service', () => ({
  NotificationFinalizationService: jest.fn().mockImplementation(() => ({ resolve: resolveDelivery })),
}));
import { main } from '../cli/reconcile-notifications';
const tenant = '11111111-1111-4111-8111-111111111111';
const delivery = '22222222-2222-4222-8222-222222222222';
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  connect.mockResolvedValue(undefined);
  disconnect.mockResolvedValue(undefined);
  list.mockResolvedValue([]);
  inspect.mockResolvedValue({ id: delivery });
  resolveDelivery.mockResolvedValue({ changed: true });
});
afterEach(() => jest.restoreAllMocks());
it('shows help and rejects unsafe resolution before connecting to a database', async () => {
  await main(['--help']);
  await expect(main(['resolve', '--tenant', tenant, '--delivery', delivery])).rejects.toThrow();
  expect(PrismaConstructor).not.toHaveBeenCalled();
});
it('lists scoped metadata with a continuation and closes its standalone connection', async () => {
  list.mockResolvedValue([{ id: delivery }]);
  await main(['list', '--tenant', tenant, '--limit', '1']);
  expect(list).toHaveBeenCalledWith(tenant, expect.any(Date), 1, undefined);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`"after": "${delivery}"`));
  expect(disconnect).toHaveBeenCalledTimes(1);
});
it('inspects only the tenant-scoped delivery and closes the connection on not found', async () => {
  inspect.mockResolvedValue(null);
  await expect(main(['inspect', '--tenant', tenant, '--delivery', delivery])).rejects.toThrow('not found in tenant');
  expect(inspect).toHaveBeenCalledWith(tenant, delivery);
  expect(disconnect).toHaveBeenCalledTimes(1);
});
it('delegates manual proof to the same finalizer and disconnects after transaction failure', async () => {
  resolveDelivery.mockRejectedValue(new Error('transaction failed'));
  await expect(
    main([
      'resolve',
      '--tenant',
      tenant,
      '--delivery',
      delivery,
      '--workers-stopped',
      '--outcome',
      'not-accepted',
      '--operator',
      'ivan',
      '--evidence',
      'ticket-123',
    ]),
  ).rejects.toThrow('transaction failed');
  expect(resolveDelivery).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryId: delivery, tenantId: tenant, source: 'manual', outcome: 'not-accepted', evidence: 'ticket-123' }),
  );
  expect(disconnect).toHaveBeenCalledTimes(1);
});
