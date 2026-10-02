import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { AppointmentsRepository } from './appointments.repository';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { GetProfessionalsQueryDto } from '../professionals/dto/get-professionals-query.dto';

const professionalId = '019a1234-5678-7abc-8abc-123456789abc';

describe('calendar query validation', () => {
  it.each(Object.values(AppointmentStatus))('accepts state %s with UUID v7 and sorting', async (state) => {
    const dto = plainToInstance(FindAllAppointmentsParamsDto, {
      state, professionalId, date: '2030-01-07T12:00:00Z', orderBy: 'createdAt', order: 'desc', skip: '20', take: '20',
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto.skip).toBe(20);
    expect(dto.date).toBeInstanceOf(Date);
  });

  it('accepts omitted filters for all appointments', async () => {
    expect(await validate(plainToInstance(FindAllAppointmentsParamsDto, {}))).toEqual([]);
  });

  it.each([
    { state: 'all' }, { state: 'UNKNOWN' }, { professionalId: 'all' },
    { orderBy: 'unknown' }, { order: 'newest' }, { skip: '-1' }, { take: '0' }, { date: 'invalid' },
  ])('rejects invalid query %j', async (query) => {
    expect((await validate(plainToInstance(FindAllAppointmentsParamsDto, query))).length).toBeGreaterThan(0);
  });
});

describe('professional selector query validation', () => {
  it('accepts pagination numbers received as URL strings', async () => {
    const dto = plainToInstance(GetProfessionalsQueryDto, { skip: '24', take: '24' });
    expect(await validate(dto)).toEqual([]);
    expect(dto.skip).toBe(24);
    expect(dto.take).toBe(24);
  });

  it.each([{ skip: '-1' }, { take: '25' }, { take: 'invalid' }])('rejects invalid professional pagination %j', async (query) => {
    expect((await validate(plainToInstance(GetProfessionalsQueryDto, query))).length).toBeGreaterThan(0);
  });
});

describe('tenant-scoped calendar listing', () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const repository = new AppointmentsRepository({ appointment: { findMany, count } } as never);

  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([{ id: 'appointment' }]);
    count.mockReset().mockResolvedValue(25);
  });

  it('combines day, state and professional filters for data and total, before pagination', async () => {
    const result = await repository.findMany('tenant', {
      state: AppointmentStatus.CANCELLED, professionalId, date: new Date('2030-01-07T12:00:00Z'),
      orderBy: 'createdAt', order: 'desc', skip: 20, take: 20,
    });
    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ tenantId: 'tenant', status: 'CANCELLED', professionalId, startsAt: { gte: expect.any(Date), lte: expect.any(Date) } });
    expect(count).toHaveBeenCalledWith({ where: args.where });
    expect(args.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);
    expect(args.skip).toBe(20);
    expect(args.take).toBe(20);
    expect(result.meta).toEqual({ total: 25, skip: 20, take: 20 });
  });

  it.each(['asc', 'desc'] as const)('orders appointment hours %s with a stable tie-breaker', async (order) => {
    await repository.findMany('tenant', { orderBy: 'startsAt', order });
    expect(findMany.mock.calls[0][0].orderBy).toEqual([{ startsAt: order }, { id: 'asc' }]);
  });

  it('preserves default hour ordering and omits all-value filters', async () => {
    await repository.findMany('tenant', {});
    expect(findMany.mock.calls[0][0]).toEqual(expect.objectContaining({
      where: { tenantId: 'tenant' }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], skip: 0, take: 10,
    }));
  });

  it('keeps professional pagination in a stable order for the selector', async () => {
    const findProfessionals = jest.fn().mockResolvedValue([]);
    const professionals = new ProfessionalsRepository({ professional: { findMany: findProfessionals } } as never);
    await professionals.findMany('tenant', { skip: 24, take: 24 });
    expect(findProfessionals).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant', deletedAt: null }, skip: 24, take: 24, orderBy: { id: 'asc' },
    }));
  });
});
