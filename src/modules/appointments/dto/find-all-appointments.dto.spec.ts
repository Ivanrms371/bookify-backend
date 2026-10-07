import 'reflect-metadata';
import { validationPipe } from 'src/config/configuration';
import { FindAllAppointmentsParamsDto } from './find-all-appointments.dto';

describe('agenda query through global validation', () => {
  it('accepts the browser query and converts pagination to numbers', async () => {
    const query = Object.fromEntries(new URLSearchParams('date=2026-10-04&state=PENDING&orderBy=startsAt&order=asc&skip=0&take=20'));
    const result = await validationPipe.transform(query, { type: 'query', metatype: FindAllAppointmentsParamsDto });
    expect(result.date).toBe('2026-10-04');
    expect(result.skip).toBe(0);
    expect(result.take).toBe(20);
  });
});
