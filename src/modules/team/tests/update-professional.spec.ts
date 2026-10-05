/// <reference types="jest" />
import { TeamService } from '../team.service';
import { ProfessionalsService } from '../../professionals/professionals.service';
import { ProfessionalsRepository } from '../../professionals/professionals.repository';
import { InvitationsService } from '../../invitations/invitations.service';
import { InvitationsRepository } from '../../invitations/invitations.repository';
import { MembershipsService } from '../../memberships/memberships.service';
import { MembershipsRepository } from '../../memberships/memberships.repository';
import { UpdateTeamProfessionalDto } from '../dto/update-team-professional.dto';
import { validationPipe } from 'src/config/configuration';

import { accessFixture } from './access.fixture';

const viewer = { id: 'manager', role: 'OWNER' as const };
const update = (f: ReturnType<typeof accessFixture>, dto: any) => f.team.updateProfessional('t', 'p', dto, viewer);

describe('Professional editing and access', () => {
  it('normalizes only supplied contacts and leaves linked account/assignments unchanged', async () => {
    const f = accessFixture('ACTIVE');
    await update(f, { name: '  New  ', email: ' NEW@EXAMPLE.COM ', phoneNumber: '(123) 456-789', phoneCountryCode: '+54' });
    expect(f.state.professional).toMatchObject({
      name: 'New',
      email: 'new@example.com',
      phoneNumber: '123456789',
      phoneCountryCode: '54',
      userId: 'u',
      isActive: true,
    });
    expect(f.state.users[0].email).toBe('account@example.com');
    expect(f.tx.serviceAssignment.deleteMany).not.toHaveBeenCalled();
    expect(f.state.memberships[1].isActive).toBe(true);
  });
  it('changes photo and color without modifying account or access, retains them on contact saves, and clears the photo', async () => {
    const f = accessFixture('ACTIVE');
    await update(f, {
      avatarUrl: 'https://example.com/photo.webp',
      avatarPublicId: 't/avatar/new',
      colorTheme: 'bg-teal-300',
    });
    await update(f, { name: 'Updated name' });
    expect(f.state.professional).toMatchObject({
      avatarUrl: 'https://example.com/photo.webp',
      avatarPublicId: 't/avatar/new',
      colorTheme: 'bg-teal-300',
      userId: 'u',
    });
    await update(f, { avatarUrl: null, avatarPublicId: null });
    expect(f.state.professional).toMatchObject({ avatarUrl: null, avatarPublicId: null, colorTheme: 'bg-teal-300' });
    expect(f.state.memberships[1].isActive).toBe(true);
    expect(f.state.users[0].email).toBe('account@example.com');
  });
  it.each(['NONE', 'PENDING', 'EXPIRED', 'ACTIVE', 'DISABLED'])('preserves %s on omitted access saves', async (status) => {
    const f = accessFixture(status);
    const before = structuredClone(f.state);
    await expect(update(f, {})).resolves.toEqual({ success: true });
    expect(f.state).toEqual(before);
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it.each([
    ['NONE', true, 'invite'],
    ['NONE', false, 'none'],
    ['PENDING', true, 'preserve'],
    ['PENDING', false, 'revoke'],
    ['EXPIRED', true, 'invite'],
    ['EXPIRED', false, 'none'],
    ['ACTIVE', true, 'preserve'],
    ['ACTIVE', false, 'disable'],
    ['DISABLED', true, 'restore'],
    ['DISABLED', false, 'preserve'],
  ])('transitions %s with enabled=%s', async (status, enabled, outcome) => {
    const f = accessFixture(status as string);
    await update(f, { giveAccess: enabled, accessStatus: status });
    if (outcome === 'invite') {
      expect(f.state.invitations[0]).toMatchObject({ role: 'STAFF', email: 'business@example.com', revokedAt: null });
      expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
    }
    if (outcome === 'revoke') expect(f.state.invitations[0].revokedAt).toBeInstanceOf(Date);
    if (outcome === 'disable' || outcome === 'restore') {
      expect(f.state.memberships[1].isActive).toBe(enabled);
      expect(f.state.professional.userId).toBe('u');
      expect(f.state.professional.isActive).toBe(true);
    }
    if (outcome === 'preserve' || outcome === 'none') expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('restores the linked account and existing ADMIN role regardless of business email', async () => {
    const f = accessFixture('DISABLED', 'ADMIN');
    await update(f, { email: 'other@example.com', giveAccess: true, accessStatus: 'DISABLED' });
    expect(f.state.memberships[1]).toMatchObject({ role: 'ADMIN', isActive: true, userId: 'u' });
    expect(f.tx.invitation.create).not.toHaveBeenCalled();
  });
  it.each([
    ['OWNER', 'OWNER', 'manager'],
    ['ADMIN', 'ADMIN', 'manager'],
    ['STAFF', 'OWNER', 'u'],
  ])('protects %s access from %s viewer %s', async (role, actorRole, actorId) => {
    const f = accessFixture('ACTIVE', role);
    f.state.memberships[0].role = actorRole;
    if (actorId === 'u') f.state.memberships[1].role = 'OWNER';
    await expect(
      f.team.updateProfessional('t', 'p', { giveAccess: false, accessStatus: 'ACTIVE' }, { id: actorId, role: actorRole } as any),
    ).rejects.toMatchObject({ status: 403 });
    await update(f, { name: 'Editable' });
    expect(f.state.professional.name).toBe('Editable');
  });
  it('rejects revoked or STAFF actors inside the transaction', async () => {
    const f = accessFixture();
    f.state.memberships[0].isActive = false;
    await expect(update(f, { name: 'No' })).rejects.toMatchObject({ status: 403 });
  });
  it('ADMIN cannot revoke their own linked ADMIN access, while contact remains editable', async () => {
    const f = accessFixture('ACTIVE', 'ADMIN');
    await expect(
      f.team.updateProfessional('t', 'p', { giveAccess: false, accessStatus: 'ACTIVE' }, { id: 'u', role: 'ADMIN' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(f.team.updateProfessional('t', 'p', { name: 'Own contact' }, { id: 'u', role: 'ADMIN' })).resolves.toEqual({
      success: true,
    });
  });
  it('ADMIN can remove STAFF access while preserving all roles and other memberships', async () => {
    const f = accessFixture('ACTIVE');
    f.state.memberships[0].role = 'ADMIN';
    f.state.memberships.push({ id: 'other', tenantId: 'other', userId: 'u', isActive: true, role: 'OWNER' });
    await update(f, { giveAccess: false, accessStatus: 'ACTIVE' });
    expect(f.state.memberships[1]).toMatchObject({ role: 'STAFF', isActive: false });
    expect(f.state.memberships[2]).toMatchObject({ role: 'OWNER', isActive: true });
  });
  it('requires the loaded state for access intent', async () => {
    const f = accessFixture('ACTIVE');
    await expect(update(f, { giveAccess: false, accessStatus: 'PENDING', name: 'No' })).rejects.toMatchObject({ status: 409 });
    expect(f.state.professional.name).toBe('Alex');
  });
  it('replaces a pending recipient with a new token after commit, but does not resend for name/phone edits', async () => {
    const f = accessFixture('PENDING');
    await update(f, { name: 'New', phoneNumber: '1234', giveAccess: true, accessStatus: 'PENDING' });
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
    await update(f, { email: 'new@example.com', giveAccess: true, accessStatus: 'PENDING' });
    expect(f.state.invitations[1].revokedAt).toBeInstanceOf(Date);
    expect(f.state.invitations[0].token).not.toBe('old');
    expect(f.emitter.emitAsync).toHaveBeenCalledTimes(1);
  });
  it('rolls back contacts, assignments and cancellation when the replacement conflicts', async () => {
    const f = accessFixture('PENDING');
    const before = structuredClone(f.state);
    jest.spyOn(f.invitations, 'createPendingInvitation').mockRejectedValue(new Error('recipient conflict'));
    await expect(
      update(f, { email: 'new@example.com', serviceIds: ['active'], giveAccess: true, accessStatus: 'PENDING' }),
    ).rejects.toThrow('recipient conflict');
    expect(f.state).toEqual(before);
    expect(f.emitter.emitAsync).not.toHaveBeenCalled();
  });
  it('retains inactive assignments and flags, permits removing them and prevents adding inactive/deleted/cross-tenant services', async () => {
    const f = accessFixture();
    await update(f, { serviceIds: ['inactive', 'active'] });
    expect(f.state.assignments[0].isActive).toBe(false);
    await update(f, { serviceIds: ['active'] });
    expect(f.state.assignments).toHaveLength(1);
    await expect(update(f, { serviceIds: ['inactive'] })).rejects.toMatchObject({ status: 400 });
    for (const service of [
      { id: 'deleted', deletedAt: new Date(), tenantId: 't', isActive: true },
      { id: 'foreign', deletedAt: null, tenantId: 'other', isActive: true },
    ])
      f.state.services.push(service);
    for (const serviceIds of [['deleted'], ['foreign'], ['active', 'active'], ['missing']])
      await expect(update(f, { serviceIds })).rejects.toMatchObject({ status: 400 });
  });
  it('ordinary persistence updates cannot disconnect account access', async () => {
    const f = accessFixture('ACTIVE');
    await f.professionals.update('t', 'p', { giveAccess: true, name: 'New' } as any);
    expect(f.state.professional.userId).toBe('u');
    expect(f.state.memberships[1].isActive).toBe(true);
  });
});

describe('Update DTO', () => {
  const transform = (v: unknown) => validationPipe.transform(v, { type: 'body', metatype: UpdateTeamProfessionalDto });
  it('accepts omitted fields and normalizes provided fields', async () => {
    await expect(transform({})).resolves.toMatchObject({});
    await expect(transform({ email: ' TEST@EXAMPLE.COM ', phoneNumber: '(1234) 56', phoneCountryCode: '+598' })).resolves.toMatchObject({
      email: 'test@example.com',
      phoneNumber: '123456',
      phoneCountryCode: '598',
    });
  });
  it('accepts photo/color fields and explicit photo removal', async () => {
    await expect(
      transform({ avatarUrl: 'https://example.com/avatar.webp', avatarPublicId: 't/avatar/photo', colorTheme: 'bg-pink-300' }),
    ).resolves.toMatchObject({
      avatarUrl: 'https://example.com/avatar.webp',
      avatarPublicId: 't/avatar/photo',
      colorTheme: 'bg-pink-300',
    });
    await expect(transform({ avatarUrl: null, avatarPublicId: null })).resolves.toMatchObject({ avatarUrl: null, avatarPublicId: null });
  });
  it.each([
    { giveAccess: false },
    { email: 'invalid' },
    { avatarUrl: 'javascript:alert(1)' },
    { avatarUrl: 'http://example.com/avatar.webp' },
    { name: '  ' },
    { role: 'ADMIN' },
    { phone: '1234' },
    { name: null },
    { email: null },
    { giveAccess: null },
    { serviceIds: null },
  ])('rejects invalid request %j', async (dto) => {
    await expect(transform(dto)).rejects.toMatchObject({ status: 400 });
  });
});
