import { ServicesService } from '../../services/services.service';
import { TenantUsageService } from '../../tenants/features/usage/tenant-usage.service';
import { TenantUsageRepository } from '../../tenants/features/usage/tenant-usage.repository';
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
  return {
    tx,
    prisma,
    services: new ServicesService(
      new ServicesRepository(prisma as never),
      prisma as never,
      new TenantUsageService(new TenantUsageRepository(prisma as never), prisma as never),
    ),
    professionals: new ProfessionalsRepository(prisma as never),
  };
}
describe('Free caps at resource persistence boundaries', () => {
  it('checks a single service creation inside the same transaction as its write', async () => {
    const f = setup(9);
    const data = { name: 'Service', price: 0, durationMinutes: 30 };
    await f.services.create('tenant', data);
    expect(f.tx.service.create).toHaveBeenCalledWith({ data: { ...data, tenant: { connect: { id: 'tenant' } } } });
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
    expect(f.tx.service.update).toHaveBeenCalledWith({
      where: { id: 'existing', tenantId: 'tenant' },
      data: { name: 'Updated', tenant: { connect: { id: 'tenant' } } },
    });
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

it('allows bulk creation exactly up to Free capacity using an existing transaction', async () => {
  const f = setup(8);
  const data = {
    data: [
      { name: 'A', price: 0, durationMinutes: 30, tenantId: 'tenant' },
      { name: 'B', price: 0, durationMinutes: 30, tenantId: 'tenant' },
    ],
  };
  await f.services.createMany(data, f.tx as never);
  expect(f.prisma.$transaction).not.toHaveBeenCalled();
  expect(f.tx.service.createMany).toHaveBeenCalledWith(data);
  expect(f.tx.service.count.mock.invocationCallOrder[0]).toBeLessThan(f.tx.service.createMany.mock.invocationCallOrder[0]);
});

it('checks every tenant in a bulk operation before inserting any rows', async () => {
  const f = setup(9);
  const row = (tenantId: string) => ({ name: 'A', price: 0, durationMinutes: 30, tenantId });
  await expect(f.services.createMany({ data: [row('one'), row('two'), row('two')] })).rejects.toThrow();
  expect(f.tx.subscription.findUnique.mock.calls).toEqual([[{ where: { tenantId: 'one' } }], [{ where: { tenantId: 'two' } }]]);
  expect(f.tx.service.createMany).not.toHaveBeenCalled();
});

it('does not restrict paid service creation above its catalog cap', async () => {
  const f = setup(100);
  f.tx.subscription.findUnique.mockResolvedValue({ planId: 'pro', deletedAt: null });
  await f.services.create('tenant', { name: 'A', price: 0, durationMinutes: 30 });
  expect(f.tx.service.count).not.toHaveBeenCalled();
  expect(f.tx.service.create).toHaveBeenCalledTimes(1);
});
