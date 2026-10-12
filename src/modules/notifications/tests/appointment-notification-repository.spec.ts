import { AppointmentNotificationRepository } from '../infraestructure/repositories/appointment-notification.repository';
import { appointmentDate } from '../application/utils/appointment-date';

function fixture() {
  const row = {
    id: 'appointment',
    tenantId: 'tenant',
    professionalId: 'professional',
    customerId: 'customer',
    customerName: 'Booking name',
    startsAt: new Date('2030-10-15T14:00:00Z'),
    createdBy: 'CUSTOMER',
    status: 'CONFIRMED',
    professional: { name: 'Ana', deletedAt: null, user: { memberships: [{ id: 'member' }] } },
    customer: { name: 'Current name' },
    service: { name: 'Corte' },
    tenant: { slug: 'business', settings: { timeZone: 'America/Montevideo' } },
  };
  const appointment = { findFirst: jest.fn().mockResolvedValue(row) };
  const config = { get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://dashboard.example' : undefined)) };
  return { row, appointment, config, repository: new AppointmentNotificationRepository({ appointment } as never, config as never) };
}
it('loads a tenant-scoped appointment and prepares the names, timezone and professional calendar link', async () => {
  const f = fixture();
  expect(await f.repository.findById('tenant', 'appointment')).toMatchObject({
    appointmentId: 'appointment',
    professionalId: 'professional',
    professionalName: 'Ana',
    customerId: 'customer',
    customerName: 'Booking name',
    serviceName: 'Corte',
    startsAt: f.row.startsAt,
    timeZone: 'America/Montevideo',
    createdBy: 'CUSTOMER',
    status: 'CONFIRMED',
    professionalDetailsUrl: 'https://dashboard.example/business/calendar?notificationAppointmentId=appointment',
  });
  expect(f.appointment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'appointment', tenantId: 'tenant' } }));
  const select = f.appointment.findFirst.mock.calls[0][0].select;
  expect(select).not.toHaveProperty('manageToken');
  expect(select.professional.select.user.select.memberships.where).toEqual({ tenantId: 'tenant', isActive: true });
});
it('returns null for a missing or out-of-tenant appointment', async () => {
  const f = fixture();
  f.appointment.findFirst.mockResolvedValue(null);
  expect(await f.repository.findById('other-tenant', 'appointment')).toBeNull();
});
it.each([{ user: null }, { user: { memberships: [] } }, { deletedAt: new Date() }])(
  'omits the dashboard link without eligible professional access: %j',
  async (professional) => {
    const f = fixture();
    f.appointment.findFirst.mockResolvedValue({ ...f.row, professional: { ...f.row.professional, ...professional } });
    expect((await f.repository.findById('tenant', 'appointment'))?.professionalDetailsUrl).toBeUndefined();
  },
);
it.each([undefined, 'javascript:alert(1)', 'https://user:password@example.com', 'not a URL'])(
  'omits unsafe or missing dashboard origin %s',
  async (origin) => {
    const f = fixture();
    f.config.get.mockReturnValue(origin);
    expect((await f.repository.findById('tenant', 'appointment'))?.professionalDetailsUrl).toBeUndefined();
  },
);
it('uses the timezone fallback and rejects invalid configured zones', async () => {
  const f = fixture();
  f.appointment.findFirst.mockResolvedValue({ ...f.row, tenant: { ...f.row.tenant, settings: null } });
  expect((await f.repository.findById('tenant', 'appointment'))?.timeZone).toBe('America/Montevideo');
  f.appointment.findFirst.mockResolvedValue({ ...f.row, tenant: { ...f.row.tenant, settings: { timeZone: 'invalid-zone' } } });
  await expect(f.repository.findById('tenant', 'appointment')).rejects.toThrow(RangeError);
});
it('falls back to the customer name and supports customerless appointments', async () => {
  const f = fixture();
  f.appointment.findFirst.mockResolvedValue({ ...f.row, customerName: null });
  expect((await f.repository.findById('tenant', 'appointment'))?.customerName).toBe('Current name');
  f.appointment.findFirst.mockResolvedValue({ ...f.row, customerName: null, customer: null, customerId: null });
  expect(await f.repository.findById('tenant', 'appointment')).toMatchObject({ customerId: null, customerName: '' });
});
it('formats daylight-saving time without depending on the server timezone', () => {
  expect(appointmentDate(new Date('2030-03-10T06:30:00Z'), 'America/New_York').time).toBe('01:30');
  expect(appointmentDate(new Date('2030-03-10T07:30:00Z'), 'America/New_York').time).toBe('03:30');
});
