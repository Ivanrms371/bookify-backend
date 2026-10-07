import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';

const user = { id: 'staff-user', email: 'staff@example.test', name: 'Staff', jti: 'session' };
const dto = { professionalId: 'own', serviceId: 'service', startsAt: '2030-01-07T12:00:00Z' };
function fixture() {
  const appointment = { id: 'appointment', professionalId: 'own', professional: { userId: user.id }, startsAt: new Date(dto.startsAt) };
  const repository = {
    findMany: jest.fn().mockResolvedValue({ data: [appointment], meta: { total: 1 } }),
    findById: jest.fn().mockResolvedValue(appointment), create: jest.fn().mockResolvedValue(appointment),
  };
  const professionals = {
    findByUserId: jest.fn().mockResolvedValue({ id: 'own' }),
    findById: jest.fn().mockResolvedValue({ id: 'own' }),
  };
  const availability = { isSlotAvailable: jest.fn().mockResolvedValue(true) };
  const service = new AppointmentsService(repository as never, availability as never, {} as never,
    professionals as never, { findByIdAndProfessional: jest.fn().mockResolvedValue({ durationMinutes: 30, price: 10 }) } as never,
    { emit: jest.fn() } as never);
  return { service, repository, professionals, availability };
}

describe('appointment access follows backend role permissions', () => {
  it.each([undefined, 'other'])('forces STAFF listing to their linked professional (filter=%s)', async (professionalId) => {
    const f = fixture();
    await f.service.findAll('tenant', { professionalId, take: 24 }, user, ROLE_PERMISSIONS.STAFF);
    expect(f.professionals.findByUserId).toHaveBeenCalledWith('tenant', user.id);
    expect(f.repository.findMany).toHaveBeenCalledWith('tenant', { professionalId: 'own', take: 24 });
  });
  it.each(['OWNER', 'ADMIN'] as const)('retains %s listing filters', async (role) => {
    const f = fixture();
    await f.service.findAll('tenant', { professionalId: 'other' }, user, ROLE_PERMISSIONS[role]);
    expect(f.repository.findMany).toHaveBeenCalledWith('tenant', { professionalId: 'other' });
    expect(f.professionals.findByUserId).not.toHaveBeenCalled();
  });
  it('fails closed when STAFF has no professional in this tenant', async () => {
    const f = fixture();
    f.professionals.findByUserId.mockRejectedValue(new NotFoundException());
    await expect(f.service.findAll('tenant', {}, user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(NotFoundException);
    await expect(f.service.create('tenant', dto, user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(NotFoundException);
    expect(f.repository.findMany).not.toHaveBeenCalled();
    expect(f.repository.create).not.toHaveBeenCalled();
  });
  it('rejects STAFF creation for another professional before availability or writes', async () => {
    const f = fixture();
    await expect(f.service.create('tenant', { ...dto, professionalId: 'other' }, user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.availability.isSlotAvailable).not.toHaveBeenCalled();
    expect(f.repository.create).not.toHaveBeenCalled();
  });
  it.each(['OWNER', 'ADMIN', 'STAFF'] as const)('allows %s to create within its scope', async (role) => {
    const f = fixture();
    await f.service.create('tenant', dto, user, ROLE_PERMISSIONS[role]);
    expect(f.repository.create).toHaveBeenCalled();
  });
  it('allows STAFF to read their own appointment and denies another by ID', async () => {
    const f = fixture();
    await expect(f.service.findById('tenant', 'appointment', user, ROLE_PERMISSIONS.STAFF)).resolves.toMatchObject({ id: 'appointment' });
    f.repository.findById.mockResolvedValue({ professional: { userId: 'other-user' } });
    await expect(f.service.findById('tenant', 'other', user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.repository.findById).toHaveBeenLastCalledWith('tenant', 'other');
  });
});
