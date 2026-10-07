/// <reference types="jest" />
import 'reflect-metadata';
import { accessFixture } from './access.fixture';
import { TeamController } from '../team.controller';
import { ProfessionalDeletionController } from '../professional-deletion.controller';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { PERMISSIONS_KEY } from 'src/common/security/decorators/permissions.decorator';

const viewer = { id: 'manager', role: 'OWNER' as const };
const remove = (f: ReturnType<typeof accessFixture>) => f.team.deleteProfessional('t', 'p', viewer);

describe('Professional deletion', () => {
  it.each(['ACTIVE', 'DISABLED'])(
    'soft deletes a professional and removes their %s tenant membership while retaining history',
    async (status) => {
      const f = accessFixture(status);
      const user = structuredClone(f.state.users[0]);
      const assignments = structuredClone(f.state.assignments);
      f.state.appointments = [
        { id: 'past', professionalId: 'p' },
        { id: 'upcoming', professionalId: 'p' },
      ];
      f.state.memberships.push({ id: 'other', tenantId: 'other', userId: 'u', role: 'OWNER', isActive: true });
      await expect(remove(f)).resolves.toEqual({ success: true });
      expect(f.state.professional).toMatchObject({ userId: 'u', deletedAt: expect.any(Date) });
      expect(f.state.memberships.map((m: any) => m.id)).toEqual(['actor', 'other']);
      expect(f.state.users[0]).toEqual(user);
      expect(f.state.assignments).toEqual(assignments);
      expect(f.state.appointments).toEqual([
        { id: 'past', professionalId: 'p' },
        { id: 'upcoming', professionalId: 'p' },
      ]);
      await expect(f.professionals.findById('t', 'p')).resolves.toBeNull();
    },
  );
  it.each(['NONE', 'PENDING', 'EXPIRED'])(
    'deletes a professional with %s access and revokes any outstanding invitation',
    async (status) => {
      const f = accessFixture(status);
      await remove(f);
      expect(f.state.professional.deletedAt).toBeInstanceOf(Date);
      expect(f.tx.membership.delete).not.toHaveBeenCalled();
      for (const invitation of f.state.invitations) expect(invitation.revokedAt).toBeInstanceOf(Date);
    },
  );
  it('deletes a linked professional whose membership is already missing', async () => {
    const f = accessFixture('ACTIVE');
    f.state.memberships.pop();
    await remove(f);
    expect(f.state.professional.deletedAt).toBeInstanceOf(Date);
    expect(f.tx.membership.delete).not.toHaveBeenCalled();
  });
  it.each([
    ['OWNER', 'OWNER', 'manager'],
    ['ADMIN', 'ADMIN', 'manager'],
    ['STAFF', 'STAFF', 'manager'],
    ['ADMIN', 'ADMIN', 'u'],
  ])('rejects deletion of %s by %s actor %s without changing state', async (targetRole, actorRole, actorId) => {
    const f = accessFixture('ACTIVE', targetRole);
    f.state.memberships[0].role = actorRole;
    const before = structuredClone(f.state);
    await expect(f.team.deleteProfessional('t', 'p', { id: actorId, role: actorRole } as any)).rejects.toMatchObject({ status: 403 });
    expect(f.state).toEqual(before);
  });
  it('allows OWNER to remove ADMIN and ADMIN to remove STAFF', async () => {
    const owner = accessFixture('ACTIVE', 'ADMIN');
    await remove(owner);
    const admin = accessFixture('ACTIVE');
    admin.state.memberships[0].role = 'ADMIN';
    await admin.team.deleteProfessional('t', 'p', { id: 'manager', role: 'ADMIN' });
    expect(admin.state.memberships).toHaveLength(1);
  });
  it('rejects a revoked actor and a cross-tenant professional', async () => {
    const revoked = accessFixture();
    revoked.state.memberships[0].isActive = false;
    await expect(remove(revoked)).rejects.toMatchObject({ status: 403 });
    const foreign = accessFixture();
    foreign.state.professional.tenantId = 'other';
    await expect(remove(foreign)).rejects.toMatchObject({ status: 404 });
    expect(foreign.state.professional.deletedAt).toBeNull();
  });
  it('protects pending ADMIN invitations from ADMIN deletion', async () => {
    const f = accessFixture('PENDING');
    f.state.memberships[0].role = 'ADMIN';
    f.state.invitations[0].role = 'ADMIN';
    await expect(f.team.deleteProfessional('t', 'p', { id: 'manager', role: 'ADMIN' })).rejects.toMatchObject({ status: 403 });
  });
  it('rolls back soft deletion and invitation revocation if membership removal fails', async () => {
    const f = accessFixture('ACTIVE');
    const before = structuredClone(f.state);
    f.tx.membership.delete.mockRejectedValue(new Error('membership removal failed'));
    await expect(remove(f)).rejects.toThrow('membership removal failed');
    expect(f.state).toEqual(before);
  });
  it.each([true, false])('serializes deletion and acceptance (accept first: %s) without leaving access behind', async (acceptFirst) => {
    const f = accessFixture('PENDING');
    f.state.users[0].email = 'business@example.com';
    const accept = () => f.invitations.accept('old', 'u', 'business@example.com');
    const actions = acceptFirst ? [accept(), remove(f)] : [remove(f), accept()];
    const results = await Promise.allSettled(actions);
    expect(results[acceptFirst ? 1 : 0].status).toBe('fulfilled');
    expect(Number.isFinite(f.state.professional.deletedAt?.getTime())).toBe(true);
    expect(f.state.memberships.some((m: any) => m.userId === 'u')).toBe(false);
    await expect(accept()).rejects.toBeDefined();
  });
  it('both deletion endpoints delegate with the authenticated actor and preserve their permissions', async () => {
    const f = accessFixture();
    const deletion = jest.spyOn(f.team, 'deleteProfessional').mockResolvedValue({ success: true });
    const user = { id: 'manager' } as any;
    const tenant = { role: 'OWNER' } as any;
    await new TeamController(f.team).deleteProfessional('t', 'p', user, tenant);
    await new ProfessionalDeletionController(f.team).delete('t', 'p', user, tenant);
    expect(deletion).toHaveBeenNthCalledWith(1, 't', 'p', viewer);
    expect(deletion).toHaveBeenNthCalledWith(2, 't', 'p', viewer);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, TeamController.prototype.deleteProfessional)).toEqual([PERMISSIONS.PROFESSIONAL_DELETE]);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, ProfessionalDeletionController.prototype.delete)).toEqual([
      PERMISSIONS.PROFESSIONAL_DELETE,
    ]);
  });
});
