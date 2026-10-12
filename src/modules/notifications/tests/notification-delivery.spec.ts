import { NotificationDeliveryRepository } from '../infraestructure/repositories/notification-delivery.repository';

it('claims only due, pending, unclaimed deliveries from the expected attempt', async () => {
  const prisma = {
    notificationDelivery: {
      updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }),
    },
  };
  const repository = new NotificationDeliveryRepository(prisma as never);
  expect(await repository.claim('delivery', 2)).toBe(true);
  expect(await repository.claim('delivery', 2)).toBe(false);
  expect(prisma.notificationDelivery.updateMany).toHaveBeenCalledWith({
    where: {
      id: 'delivery',
      status: 'PENDING',
      claimedAt: null,
      retryCount: 2,
      OR: [{ runAt: null }, { runAt: { lte: expect.any(Date) } }],
    },
    data: { claimedAt: expect.any(Date) },
  });
});
it('excludes claimed rows before limiting the worker batch, including immediate deliveries', async () => {
  const prisma = {
    notificationDelivery: { findMany: jest.fn().mockResolvedValue([]) },
  };
  await new NotificationDeliveryRepository(prisma as never).findPendingToProcess(50);
  expect(prisma.notificationDelivery.findMany).toHaveBeenCalledWith({
    where: {
      status: 'PENDING',
      claimedAt: null,
      OR: [{ runAt: null }, { runAt: { lte: expect.any(Date) } }],
    },
    take: 50,
    orderBy: { runAt: { sort: 'asc', nulls: 'first' } },
    select: { id: true, channel: true, retryCount: true, notification: true },
  });
});
