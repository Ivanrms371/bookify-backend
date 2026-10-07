import { ParseUUIDv7Pipe } from '../../common/pipes/validate-uuidv7.pipe';
import { CUSTOMERS, fixtureId, PROFESSIONALS, SERVICES, TENANT_ID } from '../../../prisma/development/fixtures';

describe('development fixture UUIDs', () => {
  it('uses valid v7 IDs for every fixture entity and related record', async () => {
    const ids = [
      TENANT_ID,
      ...SERVICES.map((service) => service.id),
      ...PROFESSIONALS.flatMap((professional) => [professional.id, professional.userId]),
      ...CUSTOMERS.map((customer) => customer.id),
      fixtureId('tenant-hour:1:540'),
      fixtureId('professional-hour:mateo:1:540'),
      fixtureId('professional-closure'),
    ];
    const pipe = new ParseUUIDv7Pipe();
    for (const id of ids) await expect(pipe.transform(id, { type: 'param' })).resolves.toBe(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps IDs stable across time and generation order', () => {
    const expected = fixtureId('service:cut');
    jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:00:00Z'));
    try {
      fixtureId('service:beard');
      expect(fixtureId('service:cut')).toBe(expected);
      expect(fixtureId('service:beard')).not.toBe(expected);
    } finally {
      jest.useRealTimers();
    }
  });
});
