import 'reflect-metadata';
import { calendarDayRange } from './calendar-day-range';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FindAllAppointmentsParamsDto } from '../dto/find-all-appointments.dto';

describe('business calendar day boundaries', () => {
  it.each([
    ['2030-01-07', 'America/Montevideo', '2030-01-07T03:00:00.000Z', '2030-01-08T03:00:00.000Z'],
    ['2026-03-08', 'America/New_York', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z'],
    ['2026-11-01', 'America/New_York', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
    ['2026-12-31', 'Asia/Tokyo', '2026-12-30T15:00:00.000Z', '2026-12-31T15:00:00.000Z'],
  ])('%s in %s uses an exclusive next midnight', (day, zone, start, end) => {
    const range = calendarDayRange(day, zone);
    expect(range.gte.toISOString()).toBe(start);
    expect(range.lt.toISOString()).toBe(end);
  });
  it.each(['2026-02-30', 'invalid'])('rejects invalid calendar date %s', (calendarDate) => {
    expect(validateSync(plainToInstance(FindAllAppointmentsParamsDto, { date: calendarDate })).length).toBeGreaterThan(0);
  });
  it('accepts a calendar date and preserves legacy timestamp validation', () => {
    expect(validateSync(plainToInstance(FindAllAppointmentsParamsDto, { date: '2026-10-05' }))).toHaveLength(0);
    expect(validateSync(plainToInstance(FindAllAppointmentsParamsDto, { date: '2026-10-05T15:00:00Z' }))).toHaveLength(0);
  });
});
