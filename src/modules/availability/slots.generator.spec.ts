import { SlotsGenerator } from './slots.generator';
import { FetchedAppointmentBlock } from './types/slots.type';

describe('SlotsGenerator', () => {
  let generator: SlotsGenerator;

  // Fixed future date to avoid filterPastSlots/filterByMinAdvancedMinutes interference
  const futureDate = new Date(2030, 5, 15); // June 15, 2030

  // Helper: creates a Date at a specific hour:minute on our futureDate
  function at(hours: number, minutes = 0): Date {
    return new Date(2030, 5, 15, hours, minutes, 0, 0);
  }

  // Helper: creates a FetchedAppointmentBlock
  function block(startH: number, startM: number, endH: number, endM: number, staffId = 'staff-1'): FetchedAppointmentBlock {
    return { staffId, startTime: at(startH, startM), endTime: at(endH, endM) };
  }

  beforeEach(() => {
    generator = new SlotsGenerator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DYNAMIC SLOT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('generate() with dynamic strategy', () => {
    it('should generate slots based on service duration', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00 (180 min)
        interval: 30,
        serviceDuration: 60, // 1 hour
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:00, 10:00, 11:00 — 3 slots of 60 min fit in 180 min
      expect(slots).toEqual(['09:00', '10:00', '11:00']);
    });

    it('should not generate slot if remaining time is less than service duration', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 610 }], // 9:00-10:10 (70 min)
        interval: 30,
        serviceDuration: 60,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // Only 9:00 fits (60 min), 10:00 wouldn't fit (only 10 min left)
      expect(slots).toEqual(['09:00']);
    });

    it('should generate slots across multiple working blocks', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [
          { startMinutes: 540, endMinutes: 600 }, // 9:00-10:00
          { startMinutes: 660, endMinutes: 720 }, // 11:00-12:00
        ],
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual(['09:00', '09:30', '11:00', '11:30']);
    });

    it('should return empty when no blocks', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [],
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FIXED SLOT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('generate() with slot (fixed) strategy', () => {
    it('should generate slots at fixed intervals', () => {
      const slots = generator.generate({
        strategy: 'slot',
        blocks: [{ startMinutes: 540, endMinutes: 660 }], // 9:00-11:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('should generate with 15 min interval', () => {
      const slots = generator.generate({
        strategy: 'slot',
        blocks: [{ startMinutes: 600, endMinutes: 660 }], // 10:00-11:00
        interval: 15,
        serviceDuration: 15,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual(['10:00', '10:15', '10:30', '10:45']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // APPOINTMENT BLOCK OVERLAP FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  describe('overlap filtering with AppointmentBlocks', () => {
    it('should remove slots that overlap with a single appointment block', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [block(9, 30, 10, 0)], // Cita 9:30-10:00
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:00 (ok, ends at 9:30 before block), 9:30 (blocked), 10:00 (ok), ...
      expect(slots).not.toContain('09:30');
      expect(slots).toContain('09:00');
      expect(slots).toContain('10:00');
    });

    it('should remove slots that partially overlap with appointment blocks', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 60, // 1 hour service
        appointmentBlocks: [block(10, 0, 11, 0)], // Cita 10:00-11:00
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:00 (ok: 9:00-10:00, no overlap), 10:00 (blocked: overlaps with 10:00-11:00)
      // 9:30 would be blocked too (9:30-10:30 overlaps with 10:00)
      // 11:00 (ok: 11:00-12:00)
      expect(slots).toContain('09:00');
      expect(slots).not.toContain('09:30');
      expect(slots).not.toContain('10:00');
      expect(slots).toContain('11:00');
    });

    it('should handle multiple appointment blocks (service with passive time)', () => {
      // Simulates a service with passive time:
      // Block 1: 9:00-9:20 (initial active)
      // Block 2: 9:50-10:10 (final active)
      // Gap: 9:20-9:50 is FREE (passive time, staff not needed)
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [
          block(9, 0, 9, 20), // Block activo inicial
          block(9, 50, 10, 10), // Block activo final
        ],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:00 overlaps with block 1 (9:00-9:20)
      // 9:30 (9:30-10:00) overlaps with block 2 (9:50-10:10)
      // 10:00 (10:00-10:30) overlaps with block 2 (9:50-10:10)
      // 10:30 ok
      expect(slots).not.toContain('09:00');
      expect(slots).not.toContain('09:30');
      expect(slots).not.toContain('10:00');
      expect(slots).toContain('10:30');
    });

    it('should allow slot exactly after appointment block ends', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [block(9, 0, 9, 30)], // Cita 9:00-9:30
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:00 is blocked, 9:30 should be available (starts exactly when block ends)
      expect(slots).not.toContain('09:00');
      expect(slots).toContain('09:30');
    });

    it('should allow slot exactly before appointment block starts', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [block(10, 0, 10, 30)], // Cita 10:00-10:30
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // 9:30 (9:30-10:00) should be available — ends exactly when block starts
      expect(slots).toContain('09:30');
      expect(slots).not.toContain('10:00');
    });

    it('should handle no appointment blocks', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 660 }], // 9:00-11:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toHaveLength(4); // 9:00, 9:30, 10:00, 10:30
    });

    it('should block all slots when full day is booked', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 660 }], // 9:00-11:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [block(9, 0, 11, 0)], // Single block entire day
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual([]);
    });

    it('should handle multiple separate appointments throughout the day', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 720 }], // 9:00-12:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [
          block(9, 0, 9, 30), // Cita 1: 9:00-9:30
          block(10, 0, 10, 30), // Cita 2: 10:00-10:30
          block(11, 0, 11, 30), // Cita 3: 11:00-11:30
        ],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toEqual(['09:30', '10:30', '11:30']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-WORLD SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('real-world scenarios', () => {
    it('barbershop: 30 min cortes with 3 citas', () => {
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 1080 }], // 9:00-18:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [
          block(9, 0, 9, 30), // Corte 9:00
          block(10, 0, 10, 50), // Corte + Barba 10:00
          block(11, 0, 11, 30), // Corte 11:00
        ],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // Should have gaps at 9:30, and from 11:30 onwards
      expect(slots).toContain('09:30');
      expect(slots).not.toContain('09:00');
      expect(slots).not.toContain('10:00');
      expect(slots).not.toContain('10:30');
      expect(slots).not.toContain('11:00');
      expect(slots).toContain('11:30');
      expect(slots).toContain('12:00');
    });

    it('spa: 90 min service with passive time blocks', () => {
      // Masaje con piedras: 10 min active → 30 min passive → 50 min active
      // Only the active blocks occupy the staff
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 1200 }], // 9:00-20:00
        interval: 30,
        serviceDuration: 60, // Next service is 60 min
        appointmentBlocks: [
          block(9, 0, 9, 10), // Block activo inicial (10 min)
          block(9, 40, 10, 30), // Block activo final (50 min)
        ],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      // With dynamic strategy, 60 min slots from 9:00 are: 9:00, 10:00, 11:00, 12:00...
      // 9:00 overlaps block 1 (9:00-9:10)
      // 10:00 (10:00-11:00) overlaps block 2 (9:50-10:30)
      // 11:00 is first available
      expect(slots).not.toContain('09:00');
      expect(slots).not.toContain('10:00');
      expect(slots).toContain('11:00');
    });

    it('schedule exception: reduced hours', () => {
      // Staff only works 9:00-13:00 due to medical appointment
      const slots = generator.generate({
        strategy: 'dynamic',
        blocks: [{ startMinutes: 540, endMinutes: 780 }], // 9:00-13:00
        interval: 30,
        serviceDuration: 30,
        appointmentBlocks: [],
        date: futureDate,
        minAdvancedMinutes: 0,
      });

      expect(slots).toHaveLength(8); // 9:00 through 12:30
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('12:30');
    });
  });
});
