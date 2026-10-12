/// <reference types="jest" />
import 'reflect-metadata';
import { accessFixture } from '../../team/tests/access.fixture';
import { InvitationsController } from '../invitations.controller';
import { IS_PUBLIC_KEY } from 'src/common/security/decorators/public.decorator';
import { SKIP_TENANT_KEY } from 'src/common/security/decorators/skip-tenant.decorator';

function fixture() {
  const f = accessFixture('PENDING');
  f.state.users[0].email = 'business@example.com';
  return f;
}
const viewer = { id: 'manager', role: 'OWNER' as const };

describe('Invitation consumption', () => {
  it('public validation returns context and state without tokens; acceptance skips tenant membership', async () => {
    const f = fixture();
    const detail = await f.invitations.verify('old');
    expect(detail).toMatchObject({
      status: 'VALID',
      email: 'business@example.com',
      tenantSlug: 'target',
      professional: { id: 'p', name: 'Alex' },
    });
    expect(detail).not.toHaveProperty('token');
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, InvitationsController.prototype.validate)).toBe(true);
    expect(Reflect.getMetadata(SKIP_TENANT_KEY, InvitationsController.prototype.accept)).toBe(true);
  });
  it('accepted tokens may authenticate recipients but cannot be reused for new signup', async () => {
    const f = fixture();
    f.state.invitations[0].acceptedAt = new Date();
    f.state.invitations[0].expiresAt = new Date(0);
    await expect(f.invitations.findValidInvitationOrThrow('old')).rejects.toMatchObject({ status: 409 });
    await expect(f.invitations.findValidInvitationOrThrow('old', true)).resolves.toMatchObject({ token: 'old' });
    f.state.invitations[0].revokedAt = new Date();
    await expect(f.invitations.findValidInvitationOrThrow('old', true)).rejects.toMatchObject({ status: 409 });
  });
  it('atomically consumes, links and creates membership, returning the target tenant', async () => {
    const f = fixture();
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).resolves.toEqual({
      success: true,
      tenantId: 't',
      tenantSlug: 'target',
    });
    expect(f.state.professional.userId).toBe('u');
    expect(f.state.invitations[0].acceptedAt).toBeInstanceOf(Date);
    expect(f.state.memberships[1]).toMatchObject({ userId: 'u', tenantId: 't', role: 'STAFF', isActive: true });
    const statements = f.tx.$queryRaw.mock.calls.map((c: any) => c[0].join('?'));
    expect(statements[0]).toContain('FROM tenants');
    expect(statements.findIndex((s: string) => s.includes('FROM professionals'))).toBeLessThan(
      statements.findIndex((s: string) => s.includes('FROM users')),
    );
  });
  it.each(['expired', 'revoked', 'wrong account', 'membership', 'disabled membership', 'linked professional', 'other professional'])(
    'rejects %s without consuming or transferring links',
    async (reason) => {
      const f = fixture();
      if (reason === 'expired') f.state.invitations[0].expiresAt = new Date(0);
      if (reason === 'revoked') f.state.invitations[0].revokedAt = new Date();
      if (reason === 'wrong account') f.state.users[0].email = 'wrong@example.com';
      if (reason.includes('membership'))
        f.state.memberships.push({ id: 'existing', tenantId: 't', userId: 'u', role: 'ADMIN', isActive: reason === 'membership' });
      if (reason === 'linked professional') f.state.professional.userId = 'someone';
      if (reason === 'other professional') f.tx.professional.findFirst.mockResolvedValue({ id: 'another', tenantId: 'other', userId: 'u' });
      const before = structuredClone(f.state);
      await expect(f.invitations.accept('old', 'u', f.state.users[0].email)).rejects.toMatchObject({
        status: reason === 'wrong account' ? 403 : 409,
      });
      expect(f.state).toEqual(before);
    },
  );
  it('rechecks expiry/revocation inside acceptance, rather than trusting the original lookup', async () => {
    const f = fixture();
    const original = structuredClone(f.state.invitations[0]);
    f.state.invitations[0].revokedAt = new Date();
    await expect(f.prisma.$transaction((tx: any) => f.invitations.acceptWithTx(tx, original, 'u', original.email))).rejects.toMatchObject({ status: 409 });
  });
  it('rolls back consumption and membership if linking fails', async () => {
    const f = fixture();
    f.tx.professional.update.mockRejectedValue(new Error('link failed'));
    const before = structuredClone(f.state);
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).rejects.toThrow('link failed');
    expect(f.state).toEqual(before);
  });
  it('allows repeat acceptance only while membership and accepted linkage remain active', async () => {
    const f = fixture();
    await f.invitations.accept('old', 'u', 'business@example.com');
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).resolves.toMatchObject({ success: true });
    expect(f.state.memberships).toHaveLength(2);
    await f.team.updateProfessional('t', 'p', { giveAccess: false, accessStatus: 'ACTIVE' }, viewer);
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).rejects.toMatchObject({ status: 409 });
    expect(f.state.memberships[1].isActive).toBe(false);
  });
  it('duplicate simultaneous acceptances create only one membership', async () => {
    const f = fixture();
    const results = await Promise.all([
      f.invitations.accept('old', 'u', 'business@example.com'),
      f.invitations.accept('old', 'u', 'business@example.com'),
    ]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(f.state.memberships).toHaveLength(2);
  });
  it('acceptance winning over stale cancellation returns 409 and preserves membership', async () => {
    const f = fixture();
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
      f.team.updateProfessional('t', 'p', { giveAccess: false, accessStatus: 'PENDING' }, viewer),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { status: 409 } });
    expect(f.state.memberships[1].isActive).toBe(true);
  });
  it('cancellation winning over acceptance invalidates the token', async () => {
    const f = fixture();
    const results = await Promise.allSettled([
      f.team.updateProfessional('t', 'p', { giveAccess: false, accessStatus: 'PENDING' }, viewer),
      f.invitations.accept('old', 'u', 'business@example.com'),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { status: 409 } });
    expect(f.state.memberships).toHaveLength(1);
  });
  it('recipient replacement winning over acceptance invalidates the old token', async () => {
    const f = fixture();
    const results = await Promise.allSettled([
      f.team.updateProfessional('t', 'p', { email: 'new@example.com', giveAccess: true, accessStatus: 'PENDING' }, viewer),
      f.invitations.accept('old', 'u', 'business@example.com'),
    ]);
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { status: 409 } });
    expect(f.state.professional.userId).toBeNull();
  });
  it.each(['EXPIRED', 'REVOKED', 'ACCEPTED'])('shows %s tokens publicly without enabling consumption', async (status) => {
    const f = fixture();
    if (status === 'EXPIRED') f.state.invitations[0].expiresAt = new Date(0);
    if (status === 'REVOKED') f.state.invitations[0].revokedAt = new Date();
    if (status === 'ACCEPTED') f.state.invitations[0].acceptedAt = new Date();
    expect(await f.invitations.verify('old')).toMatchObject({ status, valid: false });
  });
});


describe('Member notice producer', () => {
  it('emits invitation.accepted with the caller transaction only after membership and linking succeed', async () => {
    const f = fixture();
    f.emitter.emitAsync.mockImplementation(async (name, event, tx) => {
      expect(name).toBe('invitation.accepted');
      expect(tx).toBe(f.tx);
      expect(f.state.professional.userId).toBe('u');
      expect(f.state.memberships[1].id).toBe(event.membershipId);
      expect(event.acceptedAt).toBe(f.state.invitations[0].acceptedAt.toISOString());
      expect(event).not.toHaveProperty('token');
      return [];
    });
    await f.invitations.accept('old', 'u', 'business@example.com');
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
    await f.invitations.accept('old', 'u', 'business@example.com');
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
    expect(f.tx.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u' }, select: { email: true } });
  });
  it('emits once for concurrent acceptance and also supports members without professionals', async () => {
    const f = fixture();
    f.state.invitations[0].professionalId = null;
    await Promise.all([f.invitations.accept('old', 'u', 'business@example.com'), f.invitations.accept('old', 'u', 'business@example.com')]);
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
    expect(f.state.professional.userId).toBeNull();
  });
  it('rolls back acceptance when transactional notice persistence fails', async () => {
    const f = fixture();
    f.emitter.emitAsync.mockRejectedValue(new Error('notice persistence failed'));
    const before = structuredClone(f.state);
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).rejects.toThrow('notice persistence failed');
    expect(f.state).toEqual(before);
  });
  it('does not emit on rejected acceptance or failed professional linking', async () => {
    const f = fixture();
    await expect(f.invitations.accept('old', 'u', 'wrong@example.com')).rejects.toMatchObject({ status: 403 });
    f.tx.professional.update.mockRejectedValue(new Error('link failed'));
    await expect(f.invitations.accept('old', 'u', 'business@example.com')).rejects.toThrow('link failed');
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
});

it.each(['signup', 'google'] as const)('queues the member notice inside the real %s acceptance flow', async (path) => {
  const f = fixture();
  f.state.users = [];
  const { AuthService } = await import('src/auth/services/auth.service');
  const authUsers = {
    ...f.users,
    create: jest.fn(async (data, tx) => {
      expect(tx).toBe(f.tx);
      const user = { ...data, id: 'u', tokenVersion: 0 };
      f.state.users.push(user);
      return user;
    }),
    updateLastLogin: jest.fn(),
    findMeById: jest.fn().mockResolvedValue({ activeTenant: { id: 't', slug: 'target' } }),
  };
  const auth = new AuthService(
    f.prisma, authUsers as never,
    { createOrRefreshSession: jest.fn().mockResolvedValue({ jti: 'jti', deviceId: 'device' }) } as never,
    { signAccessToken: () => 'access', signRefreshToken: () => 'refresh' } as never,
    { hash: async () => 'hash' } as never, {} as never, f.invitations,
  );
  f.emitter.emitAsync.mockImplementation(async (name, event, tx) => {
    expect(name).toBe('invitation.accepted');
    expect(tx).toBe(f.tx);
    expect(event).toMatchObject({ userId: 'u', membershipId: 'new', invitationId: 'i', tenantId: 't' });
    expect(f.state.users[0].name).toBe('Alex');
    expect(f.state.professional.userId).toBe('u');
    return [];
  });
  if (path === 'signup') {
    await auth.signup({ name: 'Alex', email: 'business@example.com', password: 'secret', token: 'old' } as never);
  } else {
    await auth.loginOrCreateFromGoogle({ name: 'Alex', email: 'business@example.com', googleId: 'google', emailVerifiedAt: new Date() }, 'device', 'old');
  }
  expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
});
