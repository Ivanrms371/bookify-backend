/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProfessionalsRepository } from '../professionals.repository';
import { GetProfessionalsQueryDto } from '../dto/get-professionals-query.dto';
import type { ProfessionalFindManyArgs, ProfessionalCountArgs } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

describe('Professional listing', () => {
  it('filters before pagination and counts with the same tenant-scoped criteria', async () => {
    const findMany = jest.fn<Promise<unknown[]>, [ProfessionalFindManyArgs]>().mockResolvedValue([]);
    const count = jest.fn<Promise<number>, [ProfessionalCountArgs]>().mockResolvedValue(25);
    const repository = new ProfessionalsRepository({ professional: { findMany, count } } as unknown as PrismaService);
    const query = plainToInstance(GetProfessionalsQueryDto, {
      query: ' Alex_% ',
      isActive: 'false',
      count: 'true',
      serviceId: '019a0000-0000-7000-8000-000000000001',
      orderBy: 'name',
      sortOrder: 'asc',
      skip: '24',
    });
    expect(await validate(query)).toHaveLength(0);
    const result = await repository.findMany('tenant-id', query);
    const args = findMany.mock.calls[0][0];
    expect(args).toMatchObject({
      skip: 24,
      take: 24,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      where: {
        tenantId: 'tenant-id',
        deletedAt: null,
        isActive: false,
        assignments: { some: { serviceId: query.serviceId, isActive: true, service: { tenantId: 'tenant-id', deletedAt: null } } },
      },
    });
    expect(args.where?.OR).toContainEqual({ name: { contains: 'Alex\\_\\%', mode: 'insensitive' } });
    expect(count.mock.calls[0][0].where).toEqual(args.where);
    expect(result.meta).toEqual({ total: 25, skip: 24, take: 24 });
  });
  it('preserves no-count listing calls and validates boolean filters', async () => {
    const findMany = jest.fn<Promise<unknown[]>, [ProfessionalFindManyArgs]>().mockResolvedValue([]);
    const count = jest.fn<Promise<number>, [ProfessionalCountArgs]>();
    const repository = new ProfessionalsRepository({ professional: { findMany, count } } as unknown as PrismaService);
    await repository.findMany('tenant-id', plainToInstance(GetProfessionalsQueryDto, { count: 'false' }));
    expect(count).not.toHaveBeenCalled();
    const invalid = plainToInstance(GetProfessionalsQueryDto, { isActive: 'invalid', count: 'invalid', query: 'x'.repeat(201) });
    expect((await validate(invalid)).map((error) => error.property).sort()).toEqual(['count', 'isActive', 'query']);
  });
});
