import { mutationFixture } from '../../appointments/tests/appointment-mutation.fixture';
/// <reference types="jest" />
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProfessionalsController } from '../professionals.controller';
import { ProfessionalsService } from '../professionals.service';
import { ProfessionalsRepository } from '../professionals.repository';
import { UpdateProfessionalStatusDto } from '../dto/update-professional-status.dto';
import { PermissionsGuard } from 'src/common/security/guards/permissions.guard';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { AvailabilityRepository } from '../../availability/availability.repository';
import { AvailabilityService } from '../../availability/availability.service';
import { SlotsGenerator } from '../../availability/slots-generator';
import { AppointmentsPublicService } from '../../appointments/appointments-public.service';
import { TenantGuard } from 'src/common/security/guards/tenant.guard';

describe('professional booking status', () => {
  const record = () => ({ id: 'p', tenantId: 't', deletedAt: null as Date | null, isActive: true,
    userId: 'owner', membership: { isActive: true }, assignments: ['s'], appointments: ['existing'] });
  function setup(professional = record()) {
    const updateMany = jest.fn(async ({ where, data }) => {
      if (professional.id !== where.id || professional.tenantId !== where.tenantId || professional.deletedAt !== where.deletedAt) return { count: 0 };
      Object.assign(professional, data);
      return { count: 1 };
    });
    const repository = new ProfessionalsRepository({ professional: { updateMany } } as never);
    const service = new ProfessionalsService({} as never, repository, {} as never);
    return { service, professional, updateMany };
  }
  it('deactivates and reactivates idempotently while preserving account access and appointments', async () => {
    const f = setup();
    for (const isActive of [false, false, true, true]) {
      await expect(f.service.updateStatus('t', 'p', isActive)).resolves.toEqual({ success: true });
      expect(f.professional).toEqual({ ...record(), isActive });
      expect(f.updateMany).toHaveBeenLastCalledWith({ where: { id: 'p', tenantId: 't', deletedAt: null }, data: { isActive } });
    }
  });
  it.each(['foreign', 'deleted', 'missing'])('rejects %s professionals without changing status', async (kind) => {
    const f = setup({ ...record(), ...(kind === 'deleted' ? { deletedAt: new Date() } : {}) });
    await expect(f.service.updateStatus(kind === 'foreign' ? 'other' : 't', kind === 'missing' ? 'missing' : 'p', false)).rejects.toBeInstanceOf(NotFoundException);
    expect(f.professional.isActive).toBe(true);
  });
  it.each([false, true])('accepts boolean %s', async (isActive) => {
    expect(await validate(plainToInstance(UpdateProfessionalStatusDto, { isActive }))).toHaveLength(0);
  });
  it.each([undefined, null, 'false', 0])('rejects invalid status %s', async (isActive) => {
    expect(await validate(plainToInstance(UpdateProfessionalStatusDto, { isActive }))).toHaveLength(1);
  });
  it.each(['OWNER', 'ADMIN', 'STAFF', 'unauthenticated'])('enforces permissions for %s', (role) => {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    const context = {
      getHandler: () => ProfessionalsController.prototype.updateStatus,
      getClass: () => ProfessionalsController,
      switchToHttp: () => ({ getRequest: () => ({ tenantContext: permissions ? { permissions } : undefined }) }),
    } as ExecutionContext;
    const guard = new PermissionsGuard(new Reflector());
    if (role === 'OWNER' || role === 'ADMIN') expect(guard.canActivate(context)).toBe(true);
    else expect(() => guard.canActivate(context)).toThrow();
  });
  it('retains tenant access after self-deactivation', async () => {
    const f = setup();
    await f.service.updateStatus('t', 'p', false);
    const membership = jest.fn().mockResolvedValue({ ...f.professional.membership, role: 'OWNER', tenant: { slug: 'business' } });
    const guard = new TenantGuard({ membership: { findUnique: membership } } as never, new Reflector());
    const request = { user: { id: f.professional.userId }, headers: { 'x-tenant-id': '019a0000-0000-7000-8000-000000000001' } };
    const context = {
      getHandler: () => ProfessionalsController.prototype.updateStatus, getClass: () => ProfessionalsController,
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
  it('rejects an unauthenticated tenant request', async () => {
    const guard = new TenantGuard({} as never, new Reflector());
    const context = {
      getHandler: () => ProfessionalsController.prototype.updateStatus, getClass: () => ProfessionalsController,
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow();
  });
  it('excludes inactive professionals from both public lists', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new ProfessionalsRepository({ professional: { findMany } } as never);
    await repository.findAllPublic('t');
    await repository.findAllPublicByService('s');
    for (const [args] of findMany.mock.calls) expect(args.where).toMatchObject({ isActive: true, deletedAt: null });
  });
  it('rejects a direct slot request for an inactive professional before checking the timeline', async () => {
    const findFirst = jest.fn(async ({ where }) => where.isActive ? null : {});
    const repository = new AvailabilityRepository({
      professional: { findFirst }, tenantSettings: { findUnique: jest.fn().mockResolvedValue({ timeZone: 'UTC' }) },
      service: { findFirst: jest.fn().mockResolvedValue({ durationMinutes: 30 }) },
    } as never);
    const service = new AvailabilityService(repository, new SlotsGenerator());
    await expect(service.isSlotAvailable({ tenantId: 't', professionalId: 'p', serviceId: 's', startsAt: '2030-01-01T12:00:00Z' })).rejects.toBeInstanceOf(NotFoundException);
    const create = jest.fn();
    const emit = jest.fn();
    const publicService = new AppointmentsPublicService(
      { create } as never, service,
      { findByPhoneOrCreate: jest.fn().mockResolvedValue({ id: 'customer' }) } as never,
      { findById: jest.fn().mockResolvedValue({ id: 'p', isActive: false }) } as never,
      { findByIdAndProfessional: jest.fn().mockResolvedValue({ durationMinutes: 30 }) } as never,
      mutationFixture(emit) as never,
    );
    await expect(publicService.create({ tenantId: 't', professionalId: 'p', serviceId: 's', startsAt: '2030-01-01T12:00:00Z',
      customerName: 'Customer', customerPhone: '123', customerPhoneCode: '598', customerEmail: 'customer@example.com' })).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'p', tenantId: 't', isActive: true, deletedAt: null }) }));
  });
});
