import { AppointmentsMapper } from './appointments.mapper';

describe('appointment display date in tenant timezone', () => {
  const appointment = (timeZone?: string) => ({
    startsAt: new Date('2030-01-08T01:30:00Z'),
    endsAt: new Date('2030-01-08T02:30:00Z'),
    tenant: timeZone ? { settings: { timeZone } } : undefined,
  });

  it.each([
    ['America/Montevideo', '7 de enero de 2030', '22:30'],
    ['Asia/Tokyo', '8 de enero de 2030', '10:30'],
    ['UTC', '8 de enero de 2030', '01:30'],
  ])('formats date and time using the stored zone %s', (zone, date, time) => {
    const input = appointment(zone);
    const result = AppointmentsMapper.toResponse(input);
    expect(result.timeZone).toBe(zone);
    expect(result.formattedStartsAt).toEqual({ date, time });
    expect(result.startsAt).toBe(input.startsAt);
    expect(result.endsAt).toBe(input.endsAt);
  });

  it('uses daylight saving rules from the configured timezone', () => {
    const result = AppointmentsMapper.toResponse({ ...appointment('Europe/Madrid'), startsAt: new Date('2030-07-08T01:30:00Z') });
    expect(result.formattedStartsAt).toEqual({ date: '8 de julio de 2030', time: '03:30' });
  });

  it('does not invent a timezone when settings are missing', () => {
    const result = AppointmentsMapper.toResponse(appointment());
    expect(result.timeZone).toBeNull();
    expect(result.formattedStartsAt).toBeNull();
  });
});

describe('appointment customer phone display', () => {
  it('returns the country code with the stored appointment phone number', () => {
    const result = AppointmentsMapper.toResponse({
      customerPhone: '99123456',
      customer: { phoneCountryCode: '598' },
    });
    expect(result.customerPhone).toBe('99123456');
    expect(result.customerPhoneCountryCode).toBe('598');
  });

  it('returns no country code when the customer is unavailable', () => {
    const result = AppointmentsMapper.toResponse({ customerPhone: '99123456' });
    expect(result.customerPhoneCountryCode).toBeNull();
  });
});
