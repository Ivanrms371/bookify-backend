import { formatWorkingHoursForFrontend, formatWorkingHoursForBackend, minutesToTime, timeToMinutes } from './schedule.utils';
import { DbWorkingHour, BusinessHour } from './schedule.types';

describe('schedule.utils', () => {
  describe('formatWorkingHoursForFrontend', () => {
    it('should convert DB working hours to 7-day BusinessHour array', () => {
      const dbHours: DbWorkingHour[] = [
        { dayOfWeek: 1, opensAt: 540, closesAt: 720 }, // MONDAY 09:00 - 12:00
        { dayOfWeek: 1, opensAt: 840, closesAt: 1080 }, // MONDAY 14:00 - 18:00
        { dayOfWeek: 5, opensAt: 600, closesAt: 900 }, // FRIDAY 10:00 - 15:00
      ];

      const result = formatWorkingHoursForFrontend(dbHours);

      expect(result).toHaveLength(7);

      const monday = result.find((d) => d.day === 'MONDAY');
      expect(monday).toEqual({
        day: 'MONDAY',
        isActive: true,
        intervals: [
          { opens: '09:00', closes: '12:00' },
          { opens: '14:00', closes: '18:00' },
        ],
      });

      const friday = result.find((d) => d.day === 'FRIDAY');
      expect(friday).toEqual({
        day: 'FRIDAY',
        isActive: true,
        intervals: [{ opens: '10:00', closes: '15:00' }],
      });

      const sunday = result.find((d) => d.day === 'SUNDAY');
      expect(sunday).toEqual({
        day: 'SUNDAY',
        isActive: false,
        intervals: [],
      });
    });

    it('should return all inactive days when db array is empty', () => {
      const result = formatWorkingHoursForFrontend([]);
      expect(result).toHaveLength(7);
      expect(result.every((d) => !d.isActive && d.intervals.length === 0)).toBe(true);
    });
  });

  describe('formatWorkingHoursForBackend', () => {
    it('should convert BusinessHour array back to DB format', () => {
      const businessHours: BusinessHour[] = [
        {
          day: 'MONDAY',
          isActive: true,
          intervals: [
            { opens: '09:00', closes: '12:00' },
            { opens: '14:00', closes: '18:00' },
          ],
        },
        {
          day: 'SUNDAY',
          isActive: false,
          intervals: [{ opens: '10:00', closes: '14:00' }],
        },
      ];

      const result = formatWorkingHoursForBackend(businessHours);

      expect(result).toEqual([
        { dayOfWeek: 1, opensAt: 540, closesAt: 720 },
        { dayOfWeek: 1, opensAt: 840, closesAt: 1080 },
      ]);
    });
  });

  describe('minutesToTime & timeToMinutes (date-fns)', () => {
    it('should format minutes to HH:mm correctly', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(720)).toBe('12:00');
      expect(minutesToTime(1080)).toBe('18:00');
    });

    it('should parse HH:mm to minutes correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('12:00')).toBe(720);
      expect(timeToMinutes('18:00')).toBe(1080);
    });
  });
});
