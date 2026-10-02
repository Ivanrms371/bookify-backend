/// <reference types="jest" />

import { ServicesRepository } from '../services.repository';
import type { ServiceFindManyArgs, ServiceCountArgs } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GetServicesQueryDto } from '../dto/get-services-query.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Service listing filters', () => {
  it('uses the same tenant-scoped filters for results and count before pagination', async () => {
    const findMany = jest.fn<Promise<unknown[]>, [ServiceFindManyArgs]>().mockResolvedValue([]);
    const count = jest.fn<Promise<number>, [ServiceCountArgs]>().mockResolvedValue(30);
    const repository = new ServicesRepository({ service: { findMany, count } } as unknown as PrismaService);
    const dto = plainToInstance(GetServicesQueryDto, {
      query: ' Hair_% ',
      isActive: 'false',
      duration: 'medium',
      discount: 'with',
      count: 'true',
      skip: '24',
      take: '24',
      orderBy: 'price',
      order: 'desc',
    });
    expect(await validate(dto)).toHaveLength(0);
    const result = await repository.findMany('tenant-id', dto);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-id',
          deletedAt: null,
          isActive: false,
          OR: [{ name: { contains: 'Hair\\_\\%', mode: 'insensitive' } }, { description: { contains: 'Hair\\_\\%', mode: 'insensitive' } }],
          durationMinutes: { gt: 30, lte: 60 },
          AND: [{ OR: [{ discountPercentage: { gt: 0 } }, { discountFixed: { gt: 0 } }] }],
        },
        skip: 24,
        take: 24,
        orderBy: [{ price: 'desc' }, { id: 'asc' }],
      }),
    );
    expect(count.mock.calls[0][0].where).toEqual(findMany.mock.calls[0][0].where);
    expect(result.meta).toEqual({ total: 30, skip: 24, take: 24 });
  });
  it('rejects unknown filters and transforms false count correctly', async () => {
    const dto = plainToInstance(GetServicesQueryDto, { duration: 'invalid', discount: 'invalid', count: 'false', query: 'x'.repeat(201) });
    expect(dto.count).toBe(false);
    expect((await validate(dto)).map((error) => error.property).sort()).toEqual(['discount', 'duration', 'query']);
  });
});
