import 'reflect-metadata';
import { AppointmentsRepository } from './appointments.repository';

describe('agenda appointment list', () => {
  const setup = () => {
    const prisma = {
      tenantSettings: { findUnique: jest.fn().mockResolvedValue({ timeZone: 'America/New_York' }) },
      appointment: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    };
    return { prisma, repository: new AppointmentsRepository(prisma as never) };
  };

  it('uses the scoped business timezone and identical criteria for records and count', async () => {
    const { prisma, repository } = setup();
    await repository.findMany('tenant-a', { date: '2026-03-08', professionalId: 'p1', skip: 20, take: 20 });
    expect(prisma.tenantSettings.findUnique).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' }, select: { timeZone: true } });
    const where = prisma.appointment.findMany.mock.calls[0][0].where;
    expect(where).toEqual({
      tenantId: 'tenant-a',
      professionalId: 'p1',
      startsAt: { gte: new Date('2026-03-08T05:00:00Z'), lt: new Date('2026-03-09T04:00:00Z') },
    });
    expect(prisma.appointment.count).toHaveBeenCalledWith({ where });
  });

  it('keeps legacy date requests compatible without querying settings', async () => {
    const { prisma, repository } = setup();
    await repository.findMany('tenant-a', { date: new Date('2026-10-05T12:00:00Z') });
    expect(prisma.tenantSettings.findUnique).not.toHaveBeenCalled();
    const range = prisma.appointment.findMany.mock.calls[0][0].where.startsAt;
    expect(range.gte).toBeInstanceOf(Date);
    expect(range.lte).toBeInstanceOf(Date);
  });
});
