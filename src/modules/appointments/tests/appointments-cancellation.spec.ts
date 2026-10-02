jest.mock('../../notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { AppointmentsRepository } from '../appointments.repository';
import { AppointmentCancelledListener } from '../../notifications/listeners/appointments/appointment-cancelled.listener';
import { DashboardRepository } from '../../dashboard/dashboard.repository';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { AppointmentStatus, RecipientType } from 'src/generated/prisma/enums';

describe('dashboard appointment cancellation', () => {
  const user = { id: 'staff-user', name: 'Ana', email: 'ana@example.test', jti: 'session' };
  const ownPermissions = [PERMISSIONS.APPOINTMENT_CANCEL];
  const adminPermissions = [...ownPermissions, PERMISSIONS.APPOINTMENT_CANCEL_OTHERS];
  const appointment = () => ({
    id: 'appointment', tenantId: 'tenant', status: AppointmentStatus.CONFIRMED,
    professionalId: 'professional', professional: { userId: user.id, name: 'Ana' },
    customerId: 'customer', customer: { name: 'Cliente' }, serviceId: 'service',
    startsAt: new Date('2030-01-07T12:00:00Z'), endsAt: new Date('2030-01-07T13:00:00Z'),
  });
  let repository: { findById: jest.Mock; cancel: jest.Mock };
  let emitter: { emit: jest.Mock };
  let service: AppointmentsService;

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(appointment()),
      cancel: jest.fn().mockImplementation(async (_tenant, _id, data) => ({ ...appointment(), ...data })),
    };
    emitter = { emit: jest.fn() };
    service = new AppointmentsService(repository as never, {} as never, {} as never, {} as never, {} as never, emitter as never);
  });

  it('grants staff cancellation without granting deletion or cancellation of others', () => {
    expect(ROLE_PERMISSIONS.STAFF).toContain(PERMISSIONS.APPOINTMENT_CANCEL);
    expect(ROLE_PERMISSIONS.STAFF).not.toContain(PERMISSIONS.APPOINTMENT_DELETE);
    expect(ROLE_PERMISSIONS.STAFF).not.toContain(PERMISSIONS.APPOINTMENT_CANCEL_OTHERS);
  });

  it.each(['OWNER', 'ADMIN'] as const)('allows %s to cancel another professional’s appointment', async (role) => {
    repository.findById.mockResolvedValue({ ...appointment(), professional: { userId: 'other', name: 'Otro' } });
    await service.cancel('tenant', 'appointment', user, ROLE_PERMISSIONS[role]);
    expect(repository.cancel).toHaveBeenCalledTimes(1);
  });

  it('allows staff own cancellation, trims the reason, and emits the customer notification event', async () => {
    const result = await service.cancel('tenant', 'appointment', user, ownPermissions, { cancellationReason: '  Me enfermé  ' });
    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(repository.findById).toHaveBeenCalledWith('tenant', 'appointment');
    expect(repository.cancel).toHaveBeenCalledWith('tenant', 'appointment', {
      status: AppointmentStatus.CANCELLED, cancelledAt: expect.any(Date), cancellationReason: 'Me enfermé',
    });
    expect(emitter.emit).toHaveBeenCalledWith('appointment.cancelled', expect.objectContaining({
      tenantId: 'tenant', customerId: 'customer', cancellationReason: 'Me enfermé', cancelledBy: RecipientType.USER,
    }));
  });

  it.each(['other', null])('denies staff cancellation when the linked user is %s', async (userId) => {
    repository.findById.mockResolvedValue({ ...appointment(), professional: { userId, name: 'Otro' } });
    await expect(service.cancel('tenant', 'appointment', user, ownPermissions)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.cancel).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('rejects a caller without cancellation permission', async () => {
    await expect(service.cancel('tenant', 'appointment', user, [])).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects an ID outside the tenant scope', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.cancel('other-tenant', 'appointment', user, adminPermissions)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith('other-tenant', 'appointment');
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects completed appointments', async () => {
    repository.findById.mockResolvedValue({ ...appointment(), status: AppointmentStatus.COMPLETED });
    await expect(service.cancel('tenant', 'appointment', user, ownPermissions)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('returns a previously cancelled record without re-emitting or rewriting the reason', async () => {
    repository.findById.mockResolvedValue({ ...appointment(), status: AppointmentStatus.CANCELLED });
    const result = await service.cancel('tenant', 'appointment', user, ownPermissions, { cancellationReason: 'New reason' });
    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(repository.cancel).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('checks ownership even for previously cancelled appointments', async () => {
    repository.findById.mockResolvedValue({ ...appointment(), status: AppointmentStatus.CANCELLED, professional: { userId: 'other' } });
    await expect(service.cancel('tenant', 'appointment', user, ownPermissions)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([undefined, '', '   '])('accepts an optional or blank reason (%s)', async (cancellationReason) => {
    await service.cancel('tenant', 'appointment', user, ownPermissions, { cancellationReason });
    expect(repository.cancel.mock.calls[0][2].cancellationReason).toBeUndefined();
    expect(emitter.emit.mock.calls[0][1].cancellationReason).toBe('');
  });

  it('does not emit a customer event when no customer is linked', async () => {
    repository.findById.mockResolvedValue({ ...appointment(), customerId: null, customer: null });
    await service.cancel('tenant', 'appointment', user, ownPermissions);
    expect(repository.cancel).toHaveBeenCalledTimes(1);
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('updates the retained record and removes its blocking intervals in the same nested write', async () => {
    const update = jest.fn().mockResolvedValue({ ...appointment(), status: AppointmentStatus.CANCELLED });
    const dbRepository = new AppointmentsRepository({ appointment: { update } } as never);
    await dbRepository.cancel('tenant', 'appointment', { status: AppointmentStatus.CANCELLED });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'appointment', tenantId: 'tenant' },
      data: { status: AppointmentStatus.CANCELLED, blocks: { deleteMany: {} } },
    }));
  });

  it('cancels pending reminders before queuing the customer notification with the reason', async () => {
    const notifications = { cancelScheduledDeliveries: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) };
    const listener = new AppointmentCancelledListener(notifications as never);
    await service.cancel('tenant', 'appointment', user, ownPermissions, { cancellationReason: 'Me enfermé' });
    await listener.handle(emitter.emit.mock.calls[0][1]);
    expect(notifications.cancelScheduledDeliveries).toHaveBeenCalledWith('appointment', 'appointment.reminder');
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'customer', recipientType: RecipientType.CUSTOMER, type: 'appointment.cancelled',
      payload: expect.objectContaining({ cancellationReason: 'Me enfermé' }),
    }));
    expect(notifications.cancelScheduledDeliveries.mock.invocationCallOrder[0]).toBeLessThan(notifications.create.mock.invocationCallOrder[0]);
  });

  it('excludes cancelled appointments from upcoming appointments without changing tenant/date scoping', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const dashboard = new DashboardRepository({ appointment: { findMany } } as never);
    await dashboard.findAppointmentsByDateRange('tenant', new Date('2030-01-07T12:00:00Z'), new Date('2030-01-07T13:00:00Z'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      tenantId: 'tenant', status: { not: 'CANCELLED' }, startsAt: { gte: expect.any(Date), lte: expect.any(Date) },
    }) }));
  });
});
