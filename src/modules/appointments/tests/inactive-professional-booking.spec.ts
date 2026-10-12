import { AppointmentsService } from '../appointments.service';
import { AppointmentsPublicService } from '../appointments-public.service';
import { AvailabilityService } from '../../availability/availability.service';
import { AvailabilityRepository } from '../../availability/availability.repository';
import { SlotsGenerator } from '../../availability/slots-generator';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { mutationFixture } from './appointment-mutation.fixture';

it.each(['dashboard', 'public'])(
  'rejects new %s bookings for an inactive professional before persisting an appointment',
  async (source) => {
    const record = { id: 'professional', tenantId: 'tenant', isActive: false, deletedAt: null };
    const professionalLookup = jest.fn(async ({ where }) =>
      Object.entries(where)
        .filter(([key]) => key !== 'assignments')
        .every(([key, value]) => record[key] === value)
        ? record
        : null,
    );
    const availability = new AvailabilityService(
      new AvailabilityRepository({
        tenantSettings: { findUnique: jest.fn().mockResolvedValue({ timeZone: 'America/Montevideo' }) },
        professional: { findFirst: professionalLookup },
        service: { findFirst: jest.fn().mockResolvedValue({ durationMinutes: 30 }) },
      } as never),
      new SlotsGenerator(),
    );
    const professionals = { findById: jest.fn().mockResolvedValue(record) };
    const services = { findByIdAndProfessional: jest.fn().mockResolvedValue({ durationMinutes: 30, price: 10 }) };
    const repository = { create: jest.fn() };
    const customers = { findByPhoneOrCreate: jest.fn() };
    const dto = { professionalId: 'professional', serviceId: 'service', startsAt: '2030-10-15T14:00:00Z' };
    if (source === 'dashboard') {
      const service = new AppointmentsService(
        repository as never,
        availability,
        customers as never,
        professionals as never,
        services as never,
        mutationFixture() as never,
      );
      await expect(service.create('tenant', dto, { id: 'owner', name: 'Owner' } as never, ROLE_PERMISSIONS.OWNER)).rejects.toThrow(
        'Profesional no asignado',
      );
    } else {
      const service = new AppointmentsPublicService(
        repository as never,
        availability,
        customers as never,
        professionals as never,
        services as never,
        mutationFixture() as never,
      );
      await expect(
        service.create({ ...dto, tenantId: 'tenant', customerName: 'Luis', customerPhone: '123', customerPhoneCode: '598' }),
      ).rejects.toThrow('Profesional no asignado');
    }
    expect(professionalLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant', id: 'professional', isActive: true, deletedAt: null }),
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(customers.findByPhoneOrCreate).not.toHaveBeenCalled();
  },
);
