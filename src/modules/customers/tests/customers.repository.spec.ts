/// <reference types="jest" />

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CustomersRepository } from '../customers.repository';
import { FindAllCustomersParams } from '../dto/find-all-customers-params.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const normalize = (query: Prisma.Sql) => query.text.replace(/\s+/g, ' ').trim();

describe('Customer listing contract', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  function setup() {
    const queryRaw = jest
      .fn<Promise<unknown[]>, [Prisma.Sql]>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 49n }]);
    const repository = new CustomersRepository({ $queryRaw: queryRaw } as unknown as PrismaService);
    return { queryRaw, repository };
  }
  it('filters rows and counts within the tenant, with parameterized literal search', async () => {
    const { repository, queryRaw } = setup();
    const result = await repository.findMany({
      tenantId,
      query: " O'Brien_% ",
      status: 'blocked',
      bookingActivity: 'upcoming',
      skip: 24,
      take: 24,
    });
    const [rows, count] = queryRaw.mock.calls.map(([query]) => query);
    for (const query of [rows, count]) {
      const sql = normalize(query);
      expect(sql).toContain('c.deleted_at IS NULL');
      expect(sql).toContain('c.blocked_at IS NOT NULL');
      expect(sql).toContain("a.status IN ('PENDING', 'CONFIRMED')");
      expect(sql).toContain('a.tenant_id = c.tenant_id');
      expect(sql).toContain('a.starts_at >=');
      expect(sql).not.toContain("O'Brien");
      expect(query.values).toContain("%O'Brien\\_\\%%");
      expect(query.values).toContain(tenantId);
    }
    expect(rows.values.slice(-2)).toEqual([24, 24]);
    expect(normalize(count)).not.toContain('LIMIT');
    expect(result.meta).toEqual({ total: 49, skip: 24, take: 24 });
  });
  it('returns the earliest upcoming booking using the same time as the activity filter', async () => {
    const { repository, queryRaw } = setup();
    await repository.findMany({ tenantId, bookingActivity: 'upcoming' });
    const rows = queryRaw.mock.calls[0][0];
    const sql = normalize(rows);
    expect(sql).toContain('MIN(a.starts_at) AS next_appointment_at');
    expect(sql).toContain('upcoming.next_appointment_at AS "nextAppointmentAt"');
    expect(sql).toContain("a.customer_id = c.id AND a.tenant_id = c.tenant_id AND a.status IN ('PENDING', 'CONFIRMED') AND a.starts_at >=");
    const times = queryRaw.mock.calls.flatMap(([query]) => query.values.filter((value) => value instanceof Date));
    expect(times.length).toBeGreaterThanOrEqual(3);
    expect(new Set(times.map((time) => time.getTime())).size).toBe(1);
  });
  it('uses appointment existence rather than mutable counters for never booked', async () => {
    const { repository, queryRaw } = setup();
    await repository.findMany({ tenantId, status: 'unblocked', bookingActivity: 'never-booked' });
    for (const [query] of queryRaw.mock.calls) {
      expect(normalize(query)).toContain('c.blocked_at IS NULL AND NOT EXISTS');
      expect(normalize(query)).not.toContain('total_appointments');
      expect(normalize(query)).toContain('a.tenant_id = c.tenant_id');
    }
  });
  it.each([
    ['name', 'asc', 'c.name ASC'],
    ['createdAt', 'desc', 'c.created_at DESC'],
    ['totalSpent', 'desc', 'c.total_spent DESC'],
    ['lastVisitAt', 'desc', 'visits.last_visit_at DESC'],
  ] as const)('sorts %s before pagination with stable ties', async (orderBy, order, clause) => {
    const { repository, queryRaw } = setup();
    await repository.findMany({ tenantId, orderBy, order });
    const sql = normalize(queryRaw.mock.calls[0][0]);
    expect(sql).toContain(`ORDER BY ${clause} NULLS LAST, c.id ASC LIMIT`);
    expect(sql).toContain("a.status = 'COMPLETED' AND a.starts_at <=");
    expect(sql).toContain('MAX(a.starts_at)');
    expect(sql).toContain('c.total_spent::text AS "totalSpent"');
  });
  it('validates query options and pagination at the HTTP boundary', async () => {
    const valid = plainToInstance(FindAllCustomersParams, {
      query: 'Jane',
      status: 'blocked',
      bookingActivity: 'upcoming',
      orderBy: 'lastVisitAt',
      skip: '24',
      take: '24',
    });
    expect(await validate(valid)).toHaveLength(0);
    const invalid = plainToInstance(FindAllCustomersParams, {
      status: 'unknown',
      bookingActivity: 'unknown',
      orderBy: 'injected',
      skip: '-1',
      take: '25',
      query: 'x'.repeat(201),
    });
    expect((await validate(invalid)).map((error) => error.property).sort()).toEqual([
      'bookingActivity',
      'orderBy',
      'query',
      'skip',
      'status',
      'take',
    ]);
  });
});
