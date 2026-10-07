import { BadRequestException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { AppointmentStatus } from 'src/generated/prisma/enums';

describe('dashboard past-time scheduling', () => {
  const user = { id: 'user', name: 'Admin', email: 'admin@example.test', jti: 'session' };
  const pastStart = '2000-01-03T12:00:00Z';
  const appointment = {
    id: 'appointment', status: AppointmentStatus.CONFIRMED,
    professionalId: 'professional', serviceId: 'service', customerId: null,
    startsAt: new Date('2030-01-07T12:00:00Z'), service: { durationMinutes: 60 },
  };
  let repository: { findById: jest.Mock; create: jest.Mock; update: jest.Mock };
  let availability: { isSlotAvailable: jest.Mock };
  let service: AppointmentsService;

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(appointment),
      create: jest.fn().mockResolvedValue({ id: 'new-appointment' }),
      update: jest.fn().mockImplementation(async (_tenant, _id, data) => ({ ...appointment, ...data })),
    };
    availability = { isSlotAvailable: jest.fn().mockResolvedValue(true) };
    service = new AppointmentsService(
      repository as never, availability as never, {} as never,
      { findById: jest.fn().mockResolvedValue({ id: 'professional' }) } as never,
      { findByIdAndProfessional: jest.fn().mockResolvedValue({ durationMinutes: 60, price: 100 }) } as never,
      { emit: jest.fn() } as never,
    );
  });

  it('creates a past appointment through the dashboard with conflict validation', async () => {
    await service.create('tenant', { professionalId: 'professional', serviceId: 'service', startsAt: pastStart }, user, [PERMISSIONS.APPOINTMENT_CREATE_OTHERS]);
    expect(availability.isSlotAvailable).toHaveBeenCalledWith(expect.objectContaining({ allowPast: true, startsAt: pastStart }));
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ startsAt: new Date(pastStart) }));
  });

  it('reschedules into the past while excluding only the original appointment', async () => {
    await service.reschedule('tenant', 'appointment', user, [PERMISSIONS.APPOINTMENT_RESCHEDULE_OTHERS], { startsAt: pastStart });
    expect(availability.isSlotAvailable).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant', allowPast: true, startsAt: pastStart, excludeAppointmentId: 'appointment',
    }));
    expect(repository.update).toHaveBeenCalledWith('tenant', 'appointment', expect.objectContaining({ startsAt: new Date(pastStart) }));
  });

  it('still rejects a past slot when another appointment occupies it', async () => {
    availability.isSlotAvailable.mockResolvedValue(false);
    await expect(service.reschedule('tenant', 'appointment', user, [PERMISSIONS.APPOINTMENT_RESCHEDULE_OTHERS], { startsAt: pastStart }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
