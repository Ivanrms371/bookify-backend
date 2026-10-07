import { ServicesRepository } from '../../services/services.repository';
import { ProfessionalsRepository } from '../../professionals/professionals.repository';

function setup(used = 10) {
  const tx = {
    $executeRaw: jest.fn(),
    subscription: { findUnique: jest.fn().mockResolvedValue({ planId: 'free', deletedAt: null }) },
    service: {
      count: jest.fn().mockResolvedValue(used),
      create: jest.fn().mockResolvedValue({ id: 'new' }),
      createMany: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ deletedAt: new Date() }),
      update: jest.fn(),
    },
    professional: {
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue({ deletedAt: new Date() }),
      update: jest.fn(),
    },
  };
  const prisma = { ...tx, $transaction: jest.fn(async (work) => work(tx)) };
  return { tx, services: new ServicesRepository(prisma as never), professionals: new ProfessionalsRepository(prisma as never) };
}
describe('Free caps at resource persistence boundaries', () => {
  it('checks a single service creation inside the same transaction as its write', async () => {
    const f = setup(9);
    const data = { name: 'Service', price: 0, durationMinutes: 30, tenant: { connect: { id: 'tenant' } } };
    await f.services.create(data);
    expect(f.tx.service.create).toHaveBeenCalledWith({ data });
    expect(f.tx.service.count.mock.invocationCallOrder[0]).toBeLessThan(f.tx.service.create.mock.invocationCallOrder[0]);
  });
  it('blocks bulk creations exceeding Free capacity before any insert', async () => {
    const f = setup(9);
    await expect(
      f.services.createMany({
        data: [
          { name: 'A', price: 0, durationMinutes: 30, tenantId: 'tenant' },
          { name: 'B', price: 0, durationMinutes: 30, tenantId: 'tenant' },
        ],
      }),
    ).rejects.toThrow();
    expect(f.tx.service.createMany).not.toHaveBeenCalled();
  });
  it('allows ordinary service updates at the cap without checking additions', async () => {
    const f = setup();
    await f.services.update('tenant', 'existing', { name: 'Updated' });
    expect(f.tx.service.update).toHaveBeenCalledWith({ where: { id: 'existing', tenantId: 'tenant' }, data: { name: 'Updated' } });
    expect(f.tx.service.count).not.toHaveBeenCalled();
    expect(f.tx.$executeRaw).not.toHaveBeenCalled();
  });
  it('allows ordinary professional updates at the cap without checking additions', async () => {
    const f = setup();
    await f.professionals.update('tenant', 'existing', { name: 'Updated' });
    expect(f.tx.professional.update).toHaveBeenCalledWith({ where: { id: 'existing', tenantId: 'tenant' }, data: { name: 'Updated' } });
    expect(f.tx.professional.count).not.toHaveBeenCalled();
    expect(f.tx.$executeRaw).not.toHaveBeenCalled();
  });
});
