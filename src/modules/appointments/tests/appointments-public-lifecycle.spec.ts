import { AppointmentsPublicService } from '../appointments-public.service';
import { mutationFixture, mutationTx } from './appointment-mutation.fixture';
import { AppointmentsPublicRepository } from '../appointments-public.repository';

describe('public appointment lifecycle', () => {
  const params = {
    tenantId: 'tenant',
    serviceId: 's',
    professionalId: 'p',
    startsAt: '2030-01-07T12:00:00Z',
    customerName: 'Client',
    customerPhone: '123456',
    customerPhoneCode: '598',
    customerEmail: 'client@example.test',
  };
  function fixture() {
    const appointment = {
      id: 'a',
      tenantId: 'tenant',
      professionalId: 'p',
      serviceId: 's',
      customerId: 'c',
      status: 'CONFIRMED',
      startsAt: new Date('2030-01-07T12:00:00Z'),
      endsAt: new Date('2030-01-07T12:30:00Z'),
      rescheduleCount: 0,
      service: { durationMinutes: 30, name: 'Cut' },
      professional: { name: 'Barber', userId: 'u' },
      customer: { name: 'Client' },
    };
    const repository = {
      findByToken: jest.fn().mockResolvedValue(appointment),
      create: jest.fn().mockResolvedValue(appointment),
      update: jest.fn().mockImplementation(async (_token, data) => ({ ...appointment, ...data })),
      cancel: jest.fn().mockResolvedValue({ ...appointment, status: 'CANCELLED' }),
    };
    const customer = {
      findByPhoneOrCreate: jest.fn().mockResolvedValue({ id: 'c', name: 'Client', email: 'client@example.test', phoneNumber: '123456' }),
    };
    const availability = { isSlotAvailable: jest.fn().mockResolvedValue(true) };
    const emit = jest.fn();
    const service = new AppointmentsPublicService(
      repository as never,
      availability as never,
      customer as never,
      { findById: jest.fn().mockResolvedValue({ name: 'Barber', userId: 'u' }) } as never,
      { findByIdAndProfessional: jest.fn().mockResolvedValue({ durationMinutes: 30, price: 100, name: 'Cut' }) } as never,
      mutationFixture(emit) as never,
    );
    return { service, repository, customer, availability, emit, appointment };
  }

  it('creates confirmed with customer and booking writes on the mutation transaction', async () => {
    const f = fixture();
    await f.service.create(params);
    expect(f.repository.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'CONFIRMED' }), mutationTx);
    expect(f.customer.findByPhoneOrCreate).toHaveBeenCalledWith('tenant', expect.any(Object), mutationTx);
    expect(f.emit).toHaveBeenCalledWith('appointment.created', expect.objectContaining({ appointmentId: 'a' }));
  });

  it('does not create/update customer data for an unavailable booking', async () => {
    const f = fixture();
    f.availability.isSlotAvailable.mockResolvedValue(false);
    await expect(f.service.create(params)).rejects.toThrow();
    expect(f.customer.findByPhoneOrCreate).not.toHaveBeenCalled();
    expect(f.repository.create).not.toHaveBeenCalled();
    expect(f.emit).not.toHaveBeenCalled();
  });

  it('rechecks token within transaction, excludes its own occupancy and emits rescheduling', async () => {
    const f = fixture();
    await f.service.reschedule('token', { startsAt: '2030-01-08T12:00:00Z' });
    expect(f.repository.findByToken).toHaveBeenLastCalledWith('token', mutationTx);
    expect(f.availability.isSlotAvailable).toHaveBeenCalledWith(expect.objectContaining({ excludeAppointmentId: 'a' }));
    expect(f.repository.update).toHaveBeenCalledWith('token', expect.objectContaining({ durationMinutes: 30 }), mutationTx);
    expect(f.emit).toHaveBeenCalledWith(
      'appointment.rescheduled',
      expect.objectContaining({ appointmentId: 'a', tenantId: 'tenant', rescheduledBy: 'CUSTOMER' }),
    );
  });

  it('cancels and emits once, including a professional without an account', async () => {
    const f = fixture();
    f.repository.findByToken.mockResolvedValue({ ...f.appointment, professional: { name: 'Barber', userId: null } });
    await f.service.cancel('token', {});
    expect(f.repository.cancel).toHaveBeenCalledWith('token', expect.any(Object), mutationTx);
    expect(f.emit).toHaveBeenCalledWith('appointment.cancelled', expect.objectContaining({ userId: null, cancelledBy: 'CUSTOMER' }));
    f.repository.findByToken.mockResolvedValue({ ...f.appointment, status: 'CANCELLED' });
    await f.service.cancel('token', {});
    expect(f.repository.cancel).toHaveBeenCalledTimes(1);
    expect(f.emit).toHaveBeenCalledTimes(1);
  });

  it('removes public cancellation blocks atomically', async () => {
    const update = jest.fn();
    const tx = { appointment: { update } };
    const repository = new AppointmentsPublicRepository({} as never);
    await repository.cancel('token', {}, tx as never);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED', blocks: { deleteMany: {} } }) }),
    );
  });
});
