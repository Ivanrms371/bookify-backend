import { Prisma } from 'src/generated/prisma/client';
import { NotificationsRepository } from '../infraestructure/repositories/notifications.repository';

const input = {
  tenantId: 'tenant',
  recipientId: 'professional',
  recipientType: 'PROFESSIONAL' as const,
  type: 'professional.day-start',
  payload: { count: 1 },
  occurrenceKey: 'tenant:professional:2026-10-09:day.start',
  expiresAt: new Date('2026-10-09T13:00Z'),
};
function setup() {
  const create = jest.fn().mockResolvedValue({ id: 'notification' });
  const prisma = {
    $transaction: jest.fn(async (callback) => callback({ notification: { create } })),
    notification: { findUnique: jest.fn().mockResolvedValue({ id: 'existing' }) },
  };
  return { create, prisma, repository: new NotificationsRepository(prisma as never) };
}
it('atomically creates the occurrence and its independent channels in one transaction', async () => {
  const { repository, create, prisma } = setup();
  await repository.createOccurrence(input, ['IN_APP', 'EMAIL']);
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({ data: { ...input, deliveries: { create: [{ channel: 'IN_APP' }, { channel: 'EMAIL' }] } } });
});
it('treats a database unique collision as a duplicate only when the occurrence exists', async () => {
  const { repository, create, prisma } = setup();
  const collision = new Prisma.PrismaClientKnownRequestError('unique collision', { code: 'P2002', clientVersion: 'test' });
  create.mockRejectedValue(collision);
  expect(await repository.createOccurrence(input, ['EMAIL'])).toBeNull();
  expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { occurrenceKey: input.occurrenceKey } });
  prisma.notification.findUnique.mockResolvedValue(null as never);
  await expect(repository.createOccurrence(input, ['EMAIL'])).rejects.toBe(collision);
});
it('does not hide transaction failures', async () => {
  const { repository, create } = setup();
  create.mockRejectedValue(new Error('database unavailable'));
  await expect(repository.createOccurrence(input, ['EMAIL'])).rejects.toThrow('database unavailable');
});
