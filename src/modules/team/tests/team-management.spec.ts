/// <reference types="jest" />
import 'reflect-metadata';
import { accessFixture } from './access.fixture';
import { TeamController } from '../team.controller';
import { InvitationsController } from '../../invitations/invitations.controller';
import { UpdateTeamMemberDto } from '../dto/update-team-member.dto';
import { InviteTeamMemberDto } from '../dto/invite-team-member.dto';
import { CreateInviteDto } from '../../invitations/dto/create-invite.dto';
import { validationPipe } from 'src/config/configuration';
import { ROLE_PERMISSIONS } from 'src/common/security/constants/role-permissions.constants';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';

const actor = { id: 'manager' } as never;
const invite = { email: ' New@example.com ', role: 'STAFF' as const };

function routes(f: ReturnType<typeof accessFixture>) {
  const team = new TeamController(f.team);
  const alternate = new InvitationsController(f.invitations);
  return [
    { create: (dto = invite) => team.inviteMember('t', dto, actor), cancel: () => team.revokeInvitation('t', 'i', actor) },
    { create: (dto = invite) => alternate.create('t', dto, actor), cancel: () => alternate.revoke('t', 'i', actor) },
  ];
}

describe('Team membership contract', () => {
  it('lists active/inactive memberships and expired invitations with scoped professional metadata and no tokens', async () => {
    const f = accessFixture('DISABLED');
    f.state.invitations.push({
      id: 'expired',
      tenantId: 't',
      email: 'expired@example.com',
      role: 'STAFF',
      expiresAt: new Date(0),
      acceptedAt: null,
      revokedAt: null,
      token: 'secret',
    });
    f.state.invitations.push({ ...f.state.invitations[0], id: 'foreign', tenantId: 'other' });
    f.state.memberships.push({ id: 'foreign', tenantId: 'other', userId: 'else', role: 'ADMIN', isActive: true });
    let result = await f.team.getTeam('t');
    expect(result.members.map((m) => m.id)).toEqual(['actor', 'm']);
    expect(result.members[1]).toMatchObject({ userId: 'u', isActive: false, professional: { id: 'p' } });
    expect(result.invitations).toEqual([
      {
        id: 'expired',
        name: 'expired@example.com',
        email: 'expired@example.com',
        role: 'STAFF',
        status: 'EXPIRED',
        expiresAt: new Date(0).toISOString(),
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('secret');
    f.state.professional.tenantId = 'other';
    result = await f.team.getTeam('t');
    expect(result.members[1].professional).toBeNull();
  });
  it('includes professional invitation names only from the selected tenant', async () => {
    const f = accessFixture('PENDING');
    expect((await f.team.getTeam('t')).invitations[0]).toMatchObject({ name: 'Alex', status: 'PENDING' });
    f.state.professional.tenantId = 'other';
    expect((await f.team.getTeam('t')).invitations[0].name).toBe('business@example.com');
  });
  it('does not list professionals without memberships', async () => {
    const f = accessFixture();
    expect((await f.team.getTeam('t')).members).toHaveLength(1);
  });
  it('disables and restores explicitly without touching booking resources; DELETE remains compatible', async () => {
    const f = accessFixture('ACTIVE');
    const before = structuredClone({ professional: f.state.professional, assignments: f.state.assignments, services: f.state.services });
    await f.team.removeMember('t', 'm', 'manager');
    expect(f.state.memberships[1].isActive).toBe(false);
    await f.team.updateMember('t', 'm', { isActive: true }, 'manager');
    await f.team.updateMember('t', 'm', { isActive: true }, 'manager');
    expect(f.state.memberships[1].isActive).toBe(true);
    expect({ professional: f.state.professional, assignments: f.state.assignments, services: f.state.services }).toEqual(before);
    expect(f.tx.professional.update).not.toHaveBeenCalled();
    expect(f.tx.serviceAssignment.deleteMany).not.toHaveBeenCalled();
  });
  it.each([
    ['OWNER', 'ADMIN', 'STAFF', 200],
    ['OWNER', 'STAFF', 'ADMIN', 200],
    ['ADMIN', 'STAFF', 'STAFF', 200],
    ['ADMIN', 'STAFF', 'ADMIN', 403],
    ['ADMIN', 'ADMIN', 'STAFF', 403],
    ['STAFF', 'STAFF', 'STAFF', 403],
    ['OWNER', 'OWNER', 'STAFF', 403],
    ['OWNER', 'STAFF', 'OWNER', 403],
  ])('%s manages %s assigning %s -> %s', async (manager, target, assigned, status) => {
    const f = accessFixture('ACTIVE', target);
    f.state.memberships[0].role = manager;
    const action = f.team.updateMember('t', 'm', { role: assigned as never }, 'manager');
    if (status === 200) await expect(action).resolves.toEqual({ success: true });
    else await expect(action).rejects.toMatchObject({ status });
  });
  it('protects self and scopes target IDs to tenant', async () => {
    const f = accessFixture('ACTIVE');
    await expect(f.team.updateMember('t', 'actor', { isActive: false }, 'manager')).rejects.toMatchObject({ status: 403 });
    f.state.memberships[1].tenantId = 'other';
    await expect(f.team.removeMember('t', 'm', 'manager')).rejects.toMatchObject({ status: 404 });
  });
  it.each(['inactive', 'staff', 'admin'])('rechecks concurrent actor change to %s after acquiring the tenant lock', async (change) => {
    const f = accessFixture('ACTIVE', 'ADMIN');
    f.tx.$queryRaw.mockImplementationOnce(async () => {
      if (change === 'inactive') f.state.memberships[0].isActive = false;
      else f.state.memberships[0].role = change.toUpperCase();
      return [];
    });
    await expect(f.team.removeMember('t', 'm', 'manager')).rejects.toMatchObject({ status: 403 });
    expect(f.tx.membership.update).not.toHaveBeenCalled();
  });
});

describe('Invitation management on both route families', () => {
  it.each([0, 1])('creates normalized token-free invitations through route family %s', async (index) => {
    const f = accessFixture();
    const response = await routes(f)[index].create();
    expect(response).toMatchObject({ email: 'new@example.com', role: 'STAFF', status: 'PENDING' });
    expect(response).not.toHaveProperty('token');
    expect(f.state.invitations[0].token).toBeTruthy();
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
  });
  it.each([0, 1])('enforces OWNER/ADMIN/STAFF invitation roles for family %s', async (index) => {
    for (const role of ['OWNER', 'ADMIN', 'STAFF']) {
      const f = accessFixture();
      f.state.memberships[0].role = role;
      const action = routes(f)[index].create({ ...invite, role: 'ADMIN' as never });
      if (role === 'OWNER') await expect(action).resolves.toMatchObject({ role: 'ADMIN' });
      else await expect(action).rejects.toMatchObject({ status: 403 });
    }
  });
  it.each([0, 1])('protects admin invitations from admin cancellation through family %s', async (index) => {
    const f = accessFixture('PENDING');
    f.state.memberships[0].role = 'ADMIN';
    f.state.invitations[0].role = 'ADMIN';
    await expect(routes(f)[index].cancel()).rejects.toMatchObject({ status: 403 });
    f.state.invitations[0].role = 'STAFF';
    await expect(routes(f)[index].cancel()).resolves.toEqual({ success: true });
    expect(f.state.invitations[0].revokedAt).toBeInstanceOf(Date);
  });
  it.each(['STAFF', 'inactive'])('rejects %s actors across all invitation management operations', async (state) => {
    for (const operation of ['create', 'update', 'resend', 'cancel', 'alternate create', 'alternate cancel']) {
      const f = accessFixture('PENDING');
      if (state === 'STAFF') f.state.memberships[0].role = 'STAFF';
      else f.state.memberships[0].isActive = false;
      const actions = {
        create: () => routes(f)[0].create(),
        update: () => f.team.updateInvitation('t', 'i', { role: 'STAFF' }, 'manager'),
        resend: () => f.team.resendInvitation('t', 'i', 'manager'),
        cancel: routes(f)[0].cancel,
        'alternate create': () => routes(f)[1].create(),
        'alternate cancel': routes(f)[1].cancel,
      };
      await expect(actions[operation]()).rejects.toMatchObject({ status: 403 });
      expect(f.emitter.emitAsync).not.toHaveBeenCalled();
    }
  });
  it.each(['PENDING', 'EXPIRED'])('rejects duplicate %s invitations, directing to resend', async (state) => {
    const f = accessFixture(state);
    await expect(f.team.inviteMember('t', { email: ' BUSINESS@example.com ', role: 'STAFF' }, 'manager')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('Reenviá'),
    });
  });
  it.each(['ACTIVE', 'DISABLED'])('rejects existing %s memberships with distinct restore guidance', async (state) => {
    const f = accessFixture(state);
    await expect(f.team.inviteMember('t', { email: 'ACCOUNT@example.com', role: 'STAFF' }, 'manager')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining(state === 'DISABLED' ? 'Restaurá' : 'ya es miembro'),
    });
  });
  it('resends expired invitations with a new token and seven days, queues after commit', async () => {
    const f = accessFixture('EXPIRED');
    const oldToken = f.state.invitations[0].token;
    const start = Date.now();
    f.emitter.emitAsync.mockImplementation(async () => {
      expect(f.state.invitations[0].token).not.toBe(oldToken);
      return [];
    });
    const result = await f.team.resendInvitation('t', 'i', 'manager');
    expect(result).toMatchObject({ id: 'i', status: 'PENDING' });
    expect(result).not.toHaveProperty('token');
    expect(new Date(result.expiresAt).getTime() - start).toBeGreaterThanOrEqual(7 * 86400000);
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
    await expect(f.invitations.accept(oldToken, 'u', 'business@example.com')).rejects.toMatchObject({ status: 404 });
  });
  it.each([
    'membership',
    'inactive membership',
    'foreign professional',
    'linked professional',
    'deleted professional',
    'other professional',
  ])('rechecks %s before resend', async (reason) => {
    const f = accessFixture('EXPIRED');
    f.state.users[0].email = 'business@example.com';
    if (reason.includes('membership'))
      f.state.memberships.push({ id: 'existing', tenantId: 't', userId: 'u', role: 'STAFF', isActive: reason === 'membership' });
    if (reason === 'foreign professional') f.state.professional.tenantId = 'other';
    if (reason === 'linked professional') f.state.professional.userId = 'someone';
    if (reason === 'deleted professional') f.state.professional.deletedAt = new Date();
    if (reason === 'other professional') f.tx.professional.findFirst.mockResolvedValue({ id: 'else' });
    await expect(f.team.resendInvitation('t', 'i', 'manager')).rejects.toMatchObject({ status: 409 });
    expect(f.state.invitations[0].token).toBe('old');
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('protects invitation roles, refuses promotions by admins, and rechecks current actor access', async () => {
    const f = accessFixture('PENDING');
    f.state.memberships[0].role = 'ADMIN';
    await expect(f.team.updateInvitation('t', 'i', { role: 'ADMIN' }, 'manager')).rejects.toMatchObject({ status: 403 });
    f.state.invitations[0].role = 'ADMIN';
    await expect(f.team.resendInvitation('t', 'i', 'manager')).rejects.toMatchObject({ status: 403 });
    f.state.memberships[0].role = 'OWNER';
    const response = await f.invitations.updateRole('t', 'i', 'STAFF', 'manager');
    expect(response).not.toHaveProperty('token');
    f.tx.$queryRaw.mockImplementationOnce(async () => {
      f.state.memberships[0].isActive = false;
      return [];
    });
    await expect(f.team.resendInvitation('t', 'i', 'manager')).rejects.toMatchObject({ status: 403 });
  });
  it.each(['acceptedAt', 'revokedAt'])('returns conflicts on %s for every management action', async (field) => {
    const f = accessFixture('PENDING');
    f.state.invitations[0][field] = new Date();
    for (const action of [
      () => f.team.resendInvitation('t', 'i', 'manager'),
      () => f.team.updateInvitation('t', 'i', { role: 'STAFF' }, 'manager'),
      () => f.team.revokeInvitation('t', 'i', 'manager'),
    ]) {
      await expect(action()).rejects.toMatchObject({ status: 409 });
    }
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('scopes invitation targets to tenant for all management actions', async () => {
    const f = accessFixture('PENDING');
    f.state.invitations[0].tenantId = 'other';
    for (const action of [
      () => f.team.resendInvitation('t', 'i', 'manager'),
      () => f.team.updateInvitation('t', 'i', { role: 'STAFF' }, 'manager'),
      ...routes(f).map((r) => r.cancel),
    ])
      await expect(action()).rejects.toMatchObject({ status: 404 });
  });
  it('resend winning against acceptance invalidates the old token without creating access', async () => {
    const f = accessFixture('PENDING');
    f.state.users[0].email = 'business@example.com';
    const results = await Promise.allSettled([
      f.team.resendInvitation('t', 'i', 'manager'),
      f.invitations.accept('old', 'u', 'business@example.com'),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { status: 409 } });
    expect(f.state.memberships).toHaveLength(1);
  });
  it('serializes acceptance against resend and cancellation', async () => {
    const f = accessFixture('PENDING');
    f.state.users[0].email = 'business@example.com';
    let entered!: () => void;
    const locked = new Promise<void>((resolve) => {
      entered = resolve;
    });
    f.tx.$queryRaw.mockImplementationOnce(async () => {
      entered();
      return [];
    });
    const accepting = f.invitations.accept('old', 'u', 'business@example.com');
    await locked;
    const results = await Promise.allSettled([
      accepting,
      f.team.resendInvitation('t', 'i', 'manager'),
      f.team.revokeInvitation('t', 'i', 'manager'),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results.slice(1)).toEqual([
      expect.objectContaining({ status: 'rejected', reason: expect.objectContaining({ status: 409 }) }),
      expect.objectContaining({ status: 'rejected', reason: expect.objectContaining({ status: 409 }) }),
    ]);
    expect(f.state.memberships).toHaveLength(2);
  });
});

describe('Management request validation and guard permissions', () => {
  const transform = (value: unknown) => validationPipe.transform(value, { type: 'body', metatype: UpdateTeamMemberDto });
  it.each([{}, { role: 'OWNER' }, { role: null }, { isActive: null }, { isActive: 'false' }])(
    'rejects invalid member patch %j',
    async (dto) => {
      await expect(transform(dto)).rejects.toMatchObject({ status: 400 });
    },
  );
  it.each([{ isActive: false }, { isActive: true }, { role: 'ADMIN' }, { role: 'STAFF', isActive: true }])(
    'accepts explicit patch %j',
    async (dto) => {
      await expect(transform(dto)).resolves.toMatchObject(dto);
    },
  );
  it.each([CreateInviteDto, InviteTeamMemberDto])('accepts invitation without unused name and normalizes email', async (metatype) => {
    await expect(validationPipe.transform(invite, { type: 'body', metatype })).resolves.toMatchObject({
      email: 'new@example.com',
      role: 'STAFF',
    });
    await expect(validationPipe.transform({ ...invite, role: 'OWNER' }, { type: 'body', metatype })).rejects.toMatchObject({ status: 400 });
  });
  it('keeps Team hidden from STAFF through declared permissions', () => {
    for (const role of ['OWNER', 'ADMIN'] as const) expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.TEAM_READ);
    expect(ROLE_PERMISSIONS.STAFF).not.toContain(PERMISSIONS.TEAM_READ);
  });
});
