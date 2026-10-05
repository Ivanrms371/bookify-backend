/// <reference types="jest" />
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { TeamService } from '../team.service';
import { TeamController } from '../team.controller';
import { CreateTeamProfessionalDto } from '../dto/create-team-professional.dto';
import { InvitationsService } from '../../invitations/invitations.service';
import { ProfessionalsService } from '../../professionals/professionals.service';
import { ProfessionalsRepository } from '../../professionals/professionals.repository';
import { validationPipe } from 'src/config/configuration';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { PERMISSIONS_KEY } from 'src/common/security/decorators/permissions.decorator';
import type { Invitation, Professional } from 'src/generated/prisma/client';

const serviceId = '019a0000-0000-7000-8000-000000000001';
const dto: CreateTeamProfessionalDto = {
  name: ' Alex ',
  email: ' ALEX@example.com ',
  phoneCountryCode: '+598',
  phoneNumber: '099 123-456',
  giveAccess: false,
};

function setup() {
  let committed = false;
  const state = { professionals: [] as Professional[], invitations: [] as Invitation[], assignments: [] as unknown[] };
  const services = [{ id: serviceId, tenantId: 'tenant', isActive: true, deletedAt: null as Date | null }];
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    service: {
      findMany: jest.fn(async ({ where }) =>
        services.filter(
          (s) =>
            where.id.in.includes(s.id) &&
            s.tenantId === where.tenantId &&
            (s.isActive || where.OR?.[1]?.id?.in.includes(s.id)) &&
            s.deletedAt === null,
        ),
      ),
    },
    professional: {
      findUnique: jest.fn(async ({ where }) => state.professionals.find((p) => p.id === where.id && p.tenantId === where.tenantId) ?? null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(async ({ data }) => {
        const professional = {
          ...data,
          tenantId: data.tenant.connect.id,
          id: 'professional',
          userId: null,
          isActive: true,
        } as Professional;
        state.professionals.push(professional);
        return professional;
      }),
    },
    serviceAssignment: {
      deleteMany: jest.fn(async () => {
        state.assignments = [];
      }),
      createMany: jest.fn(async ({ data }) => {
        state.assignments.push(...data);
        return { count: data.length };
      }),
    },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(async (callback) => {
      const before = structuredClone(state);
      try {
        const result = await callback(tx);
        committed = true;
        return result;
      } catch (error) {
        Object.assign(state, before);
        throw error;
      }
    }),
  };
  const users = { findByEmail: jest.fn().mockResolvedValue(null) };
  const memberships = { findByUserId: jest.fn().mockResolvedValue(null) };
  const repository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(async (data, client) => {
      expect(client).toBe(tx);
      const invitation = {
        ...data,
        id: 'invitation',
        tenantId: 'tenant',
        professionalId: 'professional',
        acceptedAt: null,
        revokedAt: null,
      } as Invitation;
      state.invitations.push(invitation);
      return invitation;
    }),
  };
  const emitter = {
    emitAsync: jest.fn(async () => {
      expect(committed).toBe(true);
      return [];
    }),
  };
  const tenants = { findById: jest.fn().mockResolvedValue({ name: 'Business' }) };
  const professionalRepository = new ProfessionalsRepository(prisma as never);
  const professionals = new ProfessionalsService(prisma as never, professionalRepository, {} as never);
  const invitations = new InvitationsService(
    repository as never,
    tenants as never,
    users as never,
    memberships as never,
    professionals,
    prisma as never,
    emitter as never,
  );
  const team = new TeamService(memberships as never, invitations, professionals, prisma as never);
  return { state, services, tx, prisma, users, memberships, repository, emitter, team, invitations };
}

describe('Nuevo profesional', () => {
  it('creates a normalized, active unlinked professional without access or services', async () => {
    const s = setup();
    const result = await s.team.createProfessional('tenant', dto);
    expect(result).toMatchObject({
      name: 'Alex',
      email: 'alex@example.com',
      phoneCountryCode: '598',
      phoneNumber: '099123456',
      userId: null,
      isActive: true,
    });
    expect(s.state.professionals).toHaveLength(1);
    expect(s.state.invitations).toHaveLength(0);
    expect(s.state.assignments).toHaveLength(0);
    expect(s.users.findByEmail).not.toHaveBeenCalled();
    expect(s.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('commits professional, services and a pending STAFF invitation before publishing', async () => {
    const s = setup();
    const result = await s.team.createProfessional('tenant', { ...dto, giveAccess: true, serviceIds: [serviceId] });
    expect(result.userId).toBeNull();
    expect(s.state.assignments).toEqual([{ professionalId: 'professional', serviceId, isActive: true }]);
    expect(s.state.invitations[0]).toMatchObject({
      email: 'alex@example.com',
      role: 'STAFF',
      professionalId: 'professional',
      acceptedAt: null,
    });
    expect(s.emitter.emitAsync).toHaveBeenCalledWith(
      'invitation.created',
      expect.objectContaining({ invitationId: 'invitation', email: 'alex@example.com', role: 'STAFF' }),
    );
  });
  it.each(['duplicate', 'missing', 'inactive', 'deleted', 'cross-tenant'])('rejects %s services before writing', async (kind) => {
    const s = setup();
    if (kind === 'inactive') s.services[0].isActive = false;
    if (kind === 'deleted') s.services[0].deletedAt = new Date();
    if (kind === 'cross-tenant') s.services[0].tenantId = 'another-tenant';
    const serviceIds = kind === 'duplicate' ? [serviceId, serviceId] : [kind === 'missing' ? 'missing' : serviceId];
    await expect(s.team.createProfessional('tenant', { ...dto, serviceIds })).rejects.toMatchObject({
      response: { fields: { serviceIds: expect.any(String) } },
    });
    expect(s.state.professionals).toHaveLength(0);
    expect(s.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it.each(['member', 'pending invitation'])('rolls back all writes on %s conflict, with no event', async (kind) => {
    const s = setup();
    if (kind === 'member') {
      s.users.findByEmail.mockResolvedValue({ id: 'existing-user' });
      s.memberships.findByUserId.mockResolvedValue({ id: 'membership' });
    } else s.repository.findByEmail.mockResolvedValue({ acceptedAt: null, revokedAt: null, expiresAt: new Date(Date.now() + 100000) });
    await expect(s.team.createProfessional('tenant', { ...dto, giveAccess: true, serviceIds: [serviceId] })).rejects.toMatchObject({
      status: 409,
    });
    expect(s.state).toEqual({ professionals: [], invitations: [], assignments: [] });
    expect(s.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('does not publish an invitation if commit fails', async () => {
    const s = setup();
    s.prisma.$transaction.mockImplementation(async (callback) => {
      await callback(s.tx);
      Object.assign(s.state, { professionals: [], invitations: [], assignments: [] });
      throw new Error('commit failed');
    });
    await expect(s.team.createProfessional('tenant', { ...dto, giveAccess: true })).rejects.toThrow('commit failed');
    expect(s.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('keeps creation successful and intact when notification registration fails', async () => {
    const s = setup();
    s.emitter.emitAsync.mockRejectedValue(new Error('notification unavailable'));
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    try {
      await expect(s.team.createProfessional('tenant', { ...dto, giveAccess: true })).resolves.toMatchObject({ id: 'professional' });
      expect(s.state.professionals).toHaveLength(1);
      expect(s.state.invitations).toHaveLength(1);
    } finally {
      log.mockRestore();
    }
  });
  it('creates a professional with a photo and calendar color', async () => {
    const s = setup();
    const result = await s.team.createProfessional('tenant', {
      ...dto,
      avatarUrl: 'https://example.com/avatar.webp',
      avatarPublicId: 'tenant/avatar/new',
      colorTheme: 'bg-pink-300',
    });
    expect(result).toMatchObject({
      avatarUrl: 'https://example.com/avatar.webp',
      avatarPublicId: 'tenant/avatar/new',
      colorTheme: 'bg-pink-300',
    });
  });
  it('permits existing non-member users while leaving the professional unlinked', async () => {
    const s = setup();
    s.users.findByEmail.mockResolvedValue({ id: 'existing-user' });
    await s.team.createProfessional('tenant', { ...dto, giveAccess: true });
    expect(s.state.professionals[0].userId).toBeNull();
    expect(s.state.invitations).toHaveLength(1);
  });
  it('rejects non-STAFF role even without access', async () => {
    const s = setup();
    await expect(s.team.createProfessional('tenant', { ...dto, role: 'ADMIN' })).rejects.toMatchObject({ status: 400 });
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('requires TEAM_INVITE, granted to OWNER/ADMIN but not STAFF', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, TeamController.prototype.createProfessional)).toEqual([PERMISSIONS.TEAM_INVITE]);
    expect(ROLE_PERMISSIONS.OWNER).toContain(PERMISSIONS.TEAM_INVITE);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.TEAM_INVITE);
    expect(ROLE_PERMISSIONS.STAFF).not.toContain(PERMISSIONS.TEAM_INVITE);
  });
});

describe('Creation request validation', () => {
  const transform = (value: unknown) => validationPipe.transform(value, { type: 'body', metatype: CreateTeamProfessionalDto });
  it('normalizes contacts and accepts optional services/access off', async () => {
    expect(await transform(dto)).toMatchObject({
      name: 'Alex',
      email: 'alex@example.com',
      phoneCountryCode: '598',
      phoneNumber: '099123456',
      giveAccess: false,
    });
  });
  it.each(['name', 'email', 'phoneNumber', 'phoneCountryCode', 'giveAccess'])('requires %s', async (field) => {
    const value = { ...dto };
    delete value[field];
    await expect(transform(value)).rejects.toMatchObject({ response: { fields: { [field]: expect.any(String) } } });
  });
  it.each([
    ['name', '   '],
    ['email', 'invalid'],
    ['phoneNumber', '   '],
    ['phoneCountryCode', ''],
    ['phoneNumber', 'abc12345'],
    ['role', 'ADMIN'],
    ['role', 'OWNER'],
    ['serviceIds', [serviceId, serviceId]],
    ['serviceIds', ['invalid']],
  ])('rejects invalid %s', async (field, value) => {
    await expect(transform({ ...dto, [field as string]: value })).rejects.toMatchObject({
      response: { fields: { [field as string]: expect.any(String) } },
    });
  });
  it('accepts compatibility STAFF and rejects out-of-scope fields', async () => {
    await expect(transform({ ...dto, role: 'STAFF' })).resolves.toMatchObject({ role: 'STAFF' });
    await expect(transform({ ...dto, bio: 'unsupported' })).rejects.toMatchObject({ status: 400 });
  });
});

it('awaits assignment deletion before insertion and propagates deletion failure', async () => {
  let finish!: () => void;
  const deleted = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const createMany = jest.fn().mockResolvedValue({ count: 1 });
  const deleteMany = jest.fn().mockReturnValue(deleted);
  const repository = new ProfessionalsRepository({ serviceAssignment: { deleteMany, createMany } } as never);
  const replacing = repository.replaceServices('professional', [{ professionalId: 'professional', serviceId }]);
  expect(createMany).not.toHaveBeenCalled();
  finish();
  await replacing;
  expect(createMany).toHaveBeenCalledTimes(1);
  createMany.mockClear();
  deleteMany.mockRejectedValue(new Error('delete failed'));
  await expect(repository.replaceServices('professional', [])).rejects.toThrow('delete failed');
  expect(createMany).not.toHaveBeenCalled();
});
