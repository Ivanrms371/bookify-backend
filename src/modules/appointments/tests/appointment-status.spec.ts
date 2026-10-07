import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { mutationFixture, mutationTx } from './appointment-mutation.fixture';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';

describe('appointment status lifecycle', () => {
  const user = { id: 'user', name: 'Barber', email: 'barber@example.test', jti: 'session' };
  const appointment = () => ({
    id: 'a',
    status: 'CONFIRMED',
    startsAt: new Date('2020-01-01T12:00:00Z'),
    professional: { userId: user.id },
    price: 100,
  });
  const fixture = () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(appointment()),
      update: jest.fn().mockImplementation(async (_t, _id, data) => ({ ...appointment(), ...data })),
    };
    const emit = jest.fn();
    const service = new AppointmentsService(
      repo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      mutationFixture(emit) as never,
    );
    return { repo, service, emit };
  };

  it.each(['OWNER', 'ADMIN', 'STAFF'] as const)('allows %s to complete their own appointment', async (role) => {
    const f = fixture();
    const result = await f.service.changeStatus('tenant', 'a', 'COMPLETED', user, ROLE_PERMISSIONS[role]);
    expect(result.status).toBe('COMPLETED');
    expect(f.repo.update).toHaveBeenCalledWith('tenant', 'a', { status: 'COMPLETED' }, mutationTx);
    expect(f.emit).toHaveBeenCalledWith('appointment.finished', { appointmentId: 'a', tenantId: 'tenant' });
  });

  it.each(['OWNER', 'ADMIN'] as const)('allows %s to update other professionals', async (role) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), professional: { userId: 'other' } });
    await f.service.changeStatus('tenant', 'a', 'NO_SHOW', user, ROLE_PERMISSIONS[role]);
    expect(f.repo.update).toHaveBeenCalled();
  });

  it.each(['other', null])('denies STAFF another or unlinked professional (%s)', async (userId) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), professional: { userId } });
    await expect(f.service.changeStatus('tenant', 'a', 'COMPLETED', user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(f.repo.update).not.toHaveBeenCalled();
  });

  it('denies missing permissions and foreign tenant appointments', async () => {
    const f = fixture();
    await expect(f.service.changeStatus('tenant', 'a', 'COMPLETED', user, [])).rejects.toBeInstanceOf(ForbiddenException);
    f.repo.findById.mockResolvedValue(null);
    await expect(f.service.changeStatus('other-tenant', 'a', 'COMPLETED', user, ROLE_PERMISSIONS.OWNER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(f.repo.findById).toHaveBeenLastCalledWith('other-tenant', 'a', mutationTx);
  });

  it.each(['COMPLETED', 'NO_SHOW', 'CONFIRMED'] as const)('repeated %s does not rewrite or emit events', async (status) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), status });
    await f.service.changeStatus('tenant', 'a', status, user, ROLE_PERMISSIONS.STAFF);
    expect(f.repo.update).not.toHaveBeenCalled();
    expect(f.emit).not.toHaveBeenCalled();
  });

  it('confirms legacy pending bookings', async () => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), status: 'PENDING' });
    expect((await f.service.changeStatus('tenant', 'a', 'CONFIRMED', user, ROLE_PERMISSIONS.STAFF)).status).toBe('CONFIRMED');
  });

  it.each([
    ['COMPLETED', 'NO_SHOW'],
    ['NO_SHOW', 'COMPLETED'],
  ] as const)('corrects %s to %s', async (previous, next) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), status: previous });
    expect((await f.service.changeStatus('tenant', 'a', next, user, ROLE_PERMISSIONS.STAFF)).status).toBe(next);
  });

  it.each(['COMPLETED', 'NO_SHOW'] as const)('rejects %s before appointment starts', async (status) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), startsAt: new Date('2100-01-01T12:00:00Z') });
    await expect(f.service.changeStatus('tenant', 'a', status, user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['CONFIRMED', 'COMPLETED', 'NO_SHOW'] as const)('does not resurrect cancelled bookings as %s', async (status) => {
    const f = fixture();
    f.repo.findById.mockResolvedValue({ ...appointment(), status: 'CANCELLED' });
    await expect(f.service.changeStatus('tenant', 'a', status, user, ROLE_PERMISSIONS.STAFF)).rejects.toBeInstanceOf(BadRequestException);
  });
});
