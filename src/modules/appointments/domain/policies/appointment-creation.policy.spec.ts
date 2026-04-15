import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { AvailabilityPolicy } from './appointment-creation.policy';
import { AvailabilityData, Service, Settings } from './appointment-creation.type';

describe('AvailabilityPolicy', () => {
  let policy: AvailabilityPolicy;
  let queryMock: jest.Mocked<AvailabilityQuery>;

  const defaultSettings: Settings = {
    allowPassiveTimeBooking: true,
    bufferTimeMinutes: 0,
    maxAdvancedDays: 30,
    minAdvancedMinutes: 60,
    slotIntervalMinutes: 30,
  };

  const defaultService: Service = {
    initialActiveMinutes: 30,
    passiveTimeMinutes: 0,
    finalActiveMinutes: 0,
    durationMinutes: 30,
  };

  // Fixed now reference for testing
  const now = new Date('2030-01-01T10:00:00.000Z');

  // Helper date generators relative to "today" 00:00:00Z
  const at = (hours: number, minutes: number, daysOffset = 1): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  beforeEach(async () => {
    // Override Date globally to have a predictable `now` for validateAdvancedTime
    jest.useFakeTimers();
    jest.setSystemTime(now);

    queryMock = {
      getAvailabilityData: jest.fn(),
      findServiceAssignment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityPolicy, { provide: AvailabilityQuery, useValue: queryMock }],
    }).compile();

    policy = module.get<AvailabilityPolicy>(AvailabilityPolicy);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setupMocks = (availabilityOverrides?: Partial<AvailabilityData>, serviceOverrides?: Partial<Service>) => {
    const defaultAvailability: AvailabilityData = {
      tenant: { settings: defaultSettings },
      workingHours: [{ startMinutes: 540, endMinutes: 1080 }], // 9:00 - 18:00
      exceptions: [],
      appointments: [],
    };

    queryMock.getAvailabilityData.mockResolvedValue({
      ...defaultAvailability,
      ...availabilityOverrides,
    } as any);

    queryMock.findServiceAssignment.mockResolvedValue({
      service: { ...defaultService, ...serviceOverrides },
    } as any);
  };

  describe('Basic Validations', () => {
    it('throws if no availability configured', async () => {
      queryMock.getAvailabilityData.mockResolvedValue(null as any);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).rejects.toThrow(BadRequestException);
    });

    it('throws if tenant has no settings', async () => {
      queryMock.getAvailabilityData.mockResolvedValue({ tenant: { settings: null } } as any);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).rejects.toThrow(BadRequestException);
    });

    it('throws if service not assigned to staff', async () => {
      setupMocks();
      queryMock.findServiceAssignment.mockResolvedValue(null as any);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).rejects.toThrow(BadRequestException);
    });
  });

  describe('Advanced Time Validation', () => {
    beforeEach(() => setupMocks());

    it('passes if within valid advanced time', async () => {
      // 2 hours from now (min is 60 min, max is 30 days)
      const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime })).resolves.not.toThrow();
    });

    it('throws if too early (minAdvancedMinutes)', async () => {
      // 30 mins from now (min is 60 min)
      const startTime = new Date(now.getTime() + 30 * 60 * 1000);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime })).rejects.toThrow(
        'Debe reservar con al menos 60 minutos de anticipación',
      );
    });

    it('throws if too far in the future (maxAdvancedDays)', async () => {
      // 31 days from now (max is 30 days)
      const startTime = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime })).rejects.toThrow(
        'No se puede reservar con más de 30 días de anticipación',
      );
    });
  });

  describe('Working Hours Validation', () => {
    it('passes if within working hours', async () => {
      setupMocks({ workingHours: [{ startMinutes: 540, endMinutes: 1080 }] }); // 9:00 - 18:00
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).resolves.not.toThrow();
    });

    it('throws if outside working hours', async () => {
      setupMocks({ workingHours: [{ startMinutes: 540, endMinutes: 1080 }] }); // 9:00 - 18:00
      // Appointment at 17:45 for 30 min duration (ends 18:15)
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(17, 45) })).rejects.toThrow(
        'El horario está fuera del horario laboral',
      );
    });

    it('throws if exception closes the day', async () => {
      setupMocks({
        exceptions: [{ isClosed: true, blocks: [] }],
      });
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).rejects.toThrow(
        'El negocio está cerrado en esa fecha',
      );
    });

    it('uses exception blocks if present instead of normal working hours', async () => {
      setupMocks({
        workingHours: [{ startMinutes: 540, endMinutes: 1080 }], // normally 9-18
        exceptions: [{ isClosed: false, blocks: [{ startMinutes: 540, endMinutes: 720 }] }], // Exception: 9-12 only
      });
      // 10:00 works (in exception block)
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).resolves.not.toThrow();
      // 13:00 throws (outside exception block)
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(13, 0) })).rejects.toThrow();
    });
  });

  describe('Appointment Conflict Validation (AppointmentBlocks)', () => {
    it('passes if no existing appointments', async () => {
      setupMocks({ appointments: [] });
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).resolves.not.toThrow();
    });

    it('throws on direct overlap with existing active block', async () => {
      setupMocks({
        appointments: [{ blocks: [{ startTime: at(10, 0), endTime: at(11, 0) }] }],
      });
      // Trying to book 10:30 (for 30 min)
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 30) })).rejects.toThrow(ConflictException);
    });

    it('passes if exactly before or exactly after an existing block', async () => {
      setupMocks({
        appointments: [{ blocks: [{ startTime: at(10, 0), endTime: at(11, 0) }] }],
      });
      // Book 9:30 for 30 min -> ends at 10:00. No overlap.
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(9, 30) })).resolves.not.toThrow();
      // Book 11:00 for 30 min -> starts at 11:00. No overlap.
      await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(11, 0) })).resolves.not.toThrow();
    });

    describe('Passive time (gaps)', () => {
      it('passes if new appointment fits entirely in a passive gap of an existing appointment', async () => {
        // Existing appointment has a dye applied 10:00-10:20, passive wait 10:20-11:00, wash 11:00-11:20
        setupMocks({
          appointments: [
            {
              blocks: [
                { startTime: at(10, 0), endTime: at(10, 20) },
                { startTime: at(11, 0), endTime: at(11, 20) },
              ],
            },
          ],
        });

        // We want to book a simple 30 min cut at 10:20.
        // It fits purely in the gap (10:20 -> 10:50).
        await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 20) })).resolves.not.toThrow();
      });

      it('allows new appointment WITH passive time to interweave with existing blocks', async () => {
        // Existing simple block: 10:30-11:00
        setupMocks(
          {
            appointments: [{ blocks: [{ startTime: at(10, 30), endTime: at(11, 0) }] }],
          },
          {
            initialActiveMinutes: 30, // 10:00-10:30
            passiveTimeMinutes: 30, // 10:30-11:00 gap! (doesn't conflict!)
            finalActiveMinutes: 30, // 11:00-11:30
            durationMinutes: 90,
          },
        );

        // Starts at 10:00.
        // Its blocks will be: [10:00-10:30] and [11:00-11:30].
        // Existing block is [10:30-11:00].
        // NO OVERLAP on active blocks!
        await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).resolves.not.toThrow();
      });

      it('throws if the active part of new appointment overlaps existing block', async () => {
        // Existing simple block: 10:15-10:45
        setupMocks(
          {
            appointments: [{ blocks: [{ startTime: at(10, 15), endTime: at(10, 45) }] }],
          },
          {
            initialActiveMinutes: 30, // 10:00-10:30 (OVERLAPS!)
            passiveTimeMinutes: 30, // 10:30-11:00
            finalActiveMinutes: 30, // 11:00-11:30
            durationMinutes: 90,
          },
        );

        // Starts at 10:00 -> [10:00-10:30] overlaps with [10:15-10:45]
        await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 0) })).rejects.toThrow(ConflictException);
      });
    });

    describe('Buffer time', () => {
      it('throws if new appointment violates buffer time of existing appointment', async () => {
        setupMocks({
          tenant: { settings: { ...defaultSettings, bufferTimeMinutes: 10 } },
          appointments: [{ blocks: [{ startTime: at(10, 0), endTime: at(10, 30) }] }],
        });

        // Try booking at 10:35. Gap is 5 mins, but buffer is 10.
        await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 35) })).rejects.toThrow(ConflictException);
      });

      it('passes if buffer time is respected', async () => {
        setupMocks({
          tenant: { settings: { ...defaultSettings, bufferTimeMinutes: 10 } },
          appointments: [{ blocks: [{ startTime: at(10, 0), endTime: at(10, 30) }] }],
        });

        // Try booking at 10:40. Gap is 10 mins, equal to buffer. Safe.
        await expect(policy.validate({ staffId: '1', serviceId: '1', startTime: at(10, 40) })).resolves.not.toThrow();
      });
    });
  });
});
