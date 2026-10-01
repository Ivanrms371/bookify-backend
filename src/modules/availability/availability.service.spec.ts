import { AvailabilityService } from './availability.service';
import { AvailabilityRepository } from './availability.repository';
import { SlotsGenerator } from './slots-generator';

describe('staff rescheduling availability', () => {
  const params = { tenantId: 'tenant', professionalId: 'professional', serviceId: 'service', startDate: '2030-01-07' };
  const appointment = (id: string, start: string, end: string) => ({
    id, startsAt: new Date(start), endsAt: new Date(end),
    blocks: [{ startsAt: new Date(start), endsAt: new Date(end) }],
  });
  const repository = {
    getConfigurationContext: jest.fn().mockResolvedValue({
      settings: { timeZone: 'America/Montevideo', slotIntervalMinutes: 30, bufferTimeMinutes: 0 },
      professional: {}, service: { durationMinutes: 60 },
    }),
    getTimelineForRange: jest.fn().mockResolvedValue({
      tenantHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: 540, closesAt: 780 })),
      professionalHours: [], exceptions: [],
      appointments: [
        appointment('current', '2030-01-07T12:00:00Z', '2030-01-07T13:00:00Z'),
        appointment('other', '2030-01-07T14:00:00Z', '2030-01-07T15:00:00Z'),
      ],
    }),
  };
  const service = new AvailabilityService(repository as unknown as AvailabilityRepository, new SlotsGenerator());

  it('frees slots overlapping the original appointment and its blocks while retaining other conflicts', async () => {
    const result = await service.getAppointmentAvailability({ ...params, excludeAppointmentId: 'current' });
    expect(result.days[0].slots.find((slot) => slot.time === '09:30')?.status).toBe('available');
    expect(result.days[0].slots.find((slot) => slot.time === '10:30')?.status).toBe('busy');
    expect(result.days[0].slots.find((slot) => slot.time === '11:00')?.status).toBe('busy');
    expect(repository.getTimelineForRange).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant', professionalId: 'professional' }));
  });

  it('preserves creation availability when no appointment is excluded', async () => {
    const result = await service.getAppointmentAvailability(params);
    expect(result.days[0].slots.find((slot) => slot.time === '09:30')?.status).toBe('busy');
    expect(result.days[0].slots.find((slot) => slot.time === '11:00')?.status).toBe('busy');
    expect(result.days[0].slots.find((slot) => slot.time === '12:00')?.status).toBe('available');
  });

  it('does not free slots for an ID outside the scoped timeline', async () => {
    const excluded = await service.getAppointmentAvailability({ ...params, excludeAppointmentId: 'unrelated' });
    const original = await service.getAppointmentAvailability(params);
    expect(excluded).toEqual(original);
  });
});
