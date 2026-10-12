import { InvitationAcceptedListener } from '../listeners/invitations/invitation-accepted.listener';
import { MemberJoinedTemplate } from '../application/templates/member-joined/member-joined.template';
import { TEAM_NOTIFICATION_ROLES, memberNoticeVisibility } from '../application/utils/member-notification-access';
import { NotificationConfigService } from '../notification-config.service';
import type { InvitationAcceptedEvent } from '../../invitations/events/invitation-accepted.event';
import type { Notification } from 'src/generated/prisma/client';

const event: InvitationAcceptedEvent = {
  tenantId: 'tenant',
  invitationId: 'invite',
  membershipId: 'member',
  userId: 'joining',
  role: 'STAFF',
  acceptedAt: '2026-10-10T12:00:00.000Z',
};
const tenant = { id: 'tenant', name: 'Salón', slug: 'salon', memberships: [{ userId: 'owner' }, { userId: 'admin' }] };
function setup() {
  const tx = {
    tenant: { findFirst: jest.fn().mockResolvedValue(tenant) },
    membership: { findFirst: jest.fn().mockResolvedValue({ user: { name: 'Alex' } }) },
  };
  const prisma = { tenant: { findFirst: jest.fn() } };
  const notifications = { createOccurrence: jest.fn().mockResolvedValue({ id: 'notice' }) };
  return { tx, prisma, notifications, listener: new InvitationAcceptedListener(prisma as never, notifications as never) };
}

it('creates one token-free in-app occurrence per current manager, using the caller transaction and a stable invitation identity', async () => {
  const f = setup();
  await f.listener.handle(event, f.tx as never);
  expect(f.prisma.tenant.findFirst).not.toHaveBeenCalled();
  expect(f.tx.tenant.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'tenant', isActive: true, deletedAt: null },
      select: expect.objectContaining({
        memberships: {
          where: { isActive: true, role: { in: ['OWNER', 'ADMIN'] }, userId: { not: 'joining' } },
          select: { userId: true },
        },
      }),
    }),
  );
  expect(f.tx.membership.findFirst).toHaveBeenCalledWith({
    where: { id: 'member', tenantId: 'tenant', userId: 'joining', isActive: true },
    select: { user: { select: { name: true } } },
  });
  expect(f.notifications.createOccurrence).toHaveBeenCalledTimes(2);
  const [notice, tx] = f.notifications.createOccurrence.mock.calls[0] as unknown as [any, any];
  expect(tx).toBe(f.tx);
  expect(notice).toMatchObject({
    type: 'member.joined',
    recipientType: 'USER',
    recipientId: 'owner',
    referenceId: 'invite',
    occurrenceKey: 'tenant:invitation.accepted:invite:owner',
    expiresAt: new Date('2026-10-11T12:00Z'),
    payload: { ...event, memberName: 'Alex', businessName: 'Salón', teamPath: '/salon/settings?notificationTab=team' },
  });
  expect(notice.payload).not.toHaveProperty('token');
  await f.listener.handle(event, f.tx as never);
  expect(f.notifications.createOccurrence.mock.calls[2][0]).toEqual(notice);
});

it.each([null, { ...tenant, slug: null }, { ...tenant, memberships: [] }])(
  'skips missing/inactive/unroutable businesses or businesses without managers',
  async (value) => {
    const f = setup();
    f.tx.tenant.findFirst.mockResolvedValue(value as never);
    await f.listener.handle(event, f.tx as never);
    expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
  },
);

it('skips missing membership and propagates persistence failures to the acceptance transaction', async () => {
  const f = setup();
  f.tx.membership.findFirst.mockResolvedValueOnce(null);
  await f.listener.handle(event, f.tx as never);
  expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
  f.notifications.createOccurrence.mockRejectedValue(new Error('write failed'));
  await expect(f.listener.handle(event, f.tx as never)).rejects.toThrow('write failed');
});

it('rejects malformed acceptance time before creating an occurrence', async () => {
  const f = setup();
  await expect(f.listener.handle({ ...event, acceptedAt: 'invalid' }, f.tx as never)).rejects.toThrow('Invalid invitation acceptance date');
  expect(f.notifications.createOccurrence).not.toHaveBeenCalled();
});

it('renders the accepted role and real team destination; email and WhatsApp are unsupported', () => {
  const template = new MemberJoinedTemplate();
  const payload = { ...event, memberName: 'Alex', businessName: 'Salón', teamPath: '/salon/settings?notificationTab=team' };
  expect(template.build('IN_APP', payload)).toEqual({
    title: 'Alex se unió al equipo',
    message: 'Ya tiene acceso a Salón como personal.',
    actionLabel: 'Ver equipo',
    actionUrl: payload.teamPath,
    action: { version: 1, kind: 'TEAM' },
  });
  expect(template.build('IN_APP', { ...payload, role: 'ADMIN' }).message).toContain('administrador');
  expect(() => template.build('EMAIL', payload)).toThrow('Unsupported channel');
  expect(() => template.build('WHATSAPP', payload)).toThrow('Unsupported channel');
  const config = new NotificationConfigService();
  expect(config.getChannels('member.joined', 'USER')).toEqual([{ channel: 'IN_APP' }]);
  expect(TEAM_NOTIFICATION_ROLES).toEqual(['OWNER', 'ADMIN']);
});

it('retains current team-access filtering for notification history', () => {
  expect(memberNoticeVisibility('tenant', 'owner')).toMatchObject({
    OR: [
      { type: { not: 'member.joined' } },
      { tenant: { memberships: { some: { tenantId: 'tenant', userId: 'owner', isActive: true, role: { in: ['OWNER', 'ADMIN'] } } } } },
    ],
  });
});
