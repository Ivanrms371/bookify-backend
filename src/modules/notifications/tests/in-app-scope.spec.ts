import { memberNoticeVisibility } from '../application/utils/member-notification-access';
import { InAppNotificationsRepository } from '../infraestructure/repositories/in-app-notifications.repository';
import { InAppNotificationsService } from '../application/services/in-app-notifications.service';
import { NotificationsController } from '../notifications.controller';
import { NotificationsWsGateway } from '../infraestructure/gateways/notifications.ws.gateway';
import { ListInAppNotificationsDto } from '../dto/list-in-app-notifications.dto';

const tenantId = '11111111-1111-4111-8111-111111111111';
const otherTenant = '22222222-2222-4222-8222-222222222222';

describe('in-app HTTP business and recipient scope', () => {
  function setup() {
    const rows = [
      { id: 'a', tenantId, userId: 'u', readAt: null, createdAt: 3 },
      { id: 'b', tenantId: otherTenant, userId: 'u', readAt: null, createdAt: 2 },
      { id: 'c', tenantId, userId: 'other', readAt: null, createdAt: 1 },
      { id: 'team', tenantId, userId: 'u', readAt: null, createdAt: 0, type: 'member.joined', canViewTeam: false },
    ];
    const matches = (row: any, where: any): boolean => Object.entries(where).every(([key, value]: any) => {
      if (key === 'AND') return value.every((condition: any) => matches(row, condition));
      if (key === 'OR') return value.some((condition: any) => matches(row, condition));
      if (key === 'type' && value.not) return row.type !== value.not;
      if (key === 'tenant') return row.canViewTeam === true;
      return row[key] === value;
    });
    const model = {
      count: jest.fn(async ({ where }) => rows.filter(r => matches(r, where)).length),
      findMany: jest.fn(async ({ where, take }) => rows.filter(r => matches(r, where)).slice(0, take)),
      updateMany: jest.fn(async ({ where, data }) => {
        const selected = rows.filter(r => matches(r, where));
        selected.forEach(r => Object.assign(r, data));
        return { count: selected.length };
      }),
    };
    const repository = new InAppNotificationsRepository({ inAppNotification: model } as any);
    const service = new InAppNotificationsService(repository, {} as any);
    const controller = new NotificationsController(service);
    const req = { user: { id: 'u' }, tenantContext: { tenantId } } as any;
    return { controller, req, rows, model };
  }
  it('lists and counts only the selected business and recipient, keeping latest-ten ordering', async () => {
    const { controller, req, model } = setup();
    expect(await controller.getNotificationsData(req, new ListInAppNotificationsDto())).toMatchObject({ unreadCount: 1, total: 1, notifications: [{ id: 'a' }], nextCursor: null });
    expect(model.findMany).toHaveBeenCalledWith({ where: { tenantId, userId: 'u', AND: [memberNoticeVisibility(tenantId, 'u')] }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 11 });
  });
  it('hides retained member notices from lists, counts and read mutations after team access is lost', async () => {
    const { controller, req, rows } = setup();
    expect(await controller.markAsRead(req, 'team')).toEqual({ count: 0 });
    expect((await controller.getNotificationsData(req, new ListInAppNotificationsDto())).notifications.map((n: any) => n.id)).toEqual(['a']);
    expect((await controller.getNotificationsData(req, new ListInAppNotificationsDto())).total).toBe(1);
    rows[3].canViewTeam = true;
    expect((await controller.getNotificationsData(req, new ListInAppNotificationsDto())).total).toBe(2);
    expect((await controller.getNotificationsData(req, new ListInAppNotificationsDto())).unreadCount).toBe(2);
    expect(await controller.markAllAsRead(req)).toEqual({ count: 2 });
  });
  it('updates zero rows for another business, recipient or missing ID', async () => {
    const { controller, req } = setup();
    for (const id of ['b', 'c', 'missing']) expect(await controller.markAsRead(req, id)).toEqual({ count: 0 });
    expect(await controller.markAsRead(req, 'a')).toEqual({ count: 1 });
    expect(await controller.getNotificationsData(req, new ListInAppNotificationsDto())).toMatchObject({ unreadCount: 0, total: 1 });
  });
  it('read-all leaves other businesses and recipients unread', async () => {
    const { controller, req, rows } = setup();
    expect(await controller.markAllAsRead(req)).toEqual({ count: 1 });
    expect(rows.slice(1).every(r => r.readAt === null)).toBe(true);
    expect(await controller.markAllAsRead(req)).toEqual({ count: 0 });
  });
});

describe('in-app notification pagination', () => {
  const createdAt = new Date('2026-10-09T12:00:00Z');
  function setup(anchor: { id: string; createdAt: Date } | null = null) {
    const model = {
      findFirst: jest.fn().mockResolvedValue(anchor),
      findMany: jest.fn().mockResolvedValue([{ id: 'c' }, { id: 'b' }, { id: 'a' }]),
    };
    return { model, repository: new InAppNotificationsRepository({ inAppNotification: model } as any) };
  }

  it('returns the requested page and a cursor only when another row exists', async () => {
    const { repository, model } = setup();
    expect(await repository.findPage(tenantId, 'u', 2)).toEqual({
      notifications: [{ id: 'c' }, { id: 'b' }], nextCursor: 'b',
    });
    model.findMany.mockResolvedValue([{ id: 'a' }]);
    expect(await repository.findPage(tenantId, 'u', 2)).toEqual({ notifications: [{ id: 'a' }], nextCursor: null });
  });

  it.each(['foreign-business', 'foreign-recipient', 'deleted'])('returns an empty page for a %s cursor', async cursor => {
    const { repository, model } = setup();
    expect(await repository.findPage(tenantId, 'u', 2, cursor)).toEqual({ notifications: [], nextCursor: null });
    expect(model.findFirst).toHaveBeenCalledWith({ where: { id: cursor, tenantId, userId: 'u', AND: [memberNoticeVisibility(tenantId, 'u')] }, select: { id: true, createdAt: true } });
    expect(model.findMany).not.toHaveBeenCalled();
  });

  it('continues strictly after the scoped timestamp and ID, including tied timestamps', async () => {
    const { repository, model } = setup({ id: 'b', createdAt });
    await repository.findPage(tenantId, 'u', 2, 'b');
    expect(model.findMany).toHaveBeenCalledWith({
      where: { tenantId, userId: 'u', AND: [memberNoticeVisibility(tenantId, 'u')], OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: 'b' } }] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 3,
    });
  });
});

describe('notification socket access and refresh signals', () => {
  function setup() {
    const jwt = { validateAccessToken: jest.fn(() => ({ sub: 'u' })) };
    const memberships = { findByUserId: jest.fn().mockResolvedValue({ isActive: true }) };
    const gateway = new NotificationsWsGateway(jwt as any, memberships as any);
    const client = {
      handshake: { headers: { cookie: 'access_token=valid' }, auth: { tenantId } },
      data: {}, connected: true, join: jest.fn(), disconnect: jest.fn(),
    };
    return { jwt, memberships, gateway, client };
  }
  it.each(['cookies', 'token', 'invalid token', 'tenant', 'invalid tenant', 'inactive', 'missing membership'])('rejects %s', async reason => {
    const { jwt, memberships, gateway, client } = setup();
    if (reason === 'cookies') client.handshake.headers.cookie = '';
    if (reason === 'token') client.handshake.headers.cookie = 'other=value';
    if (reason === 'invalid token') jwt.validateAccessToken.mockImplementation(() => { throw new Error('invalid'); });
    if (reason === 'tenant') client.handshake.auth = {} as any;
    if (reason === 'invalid tenant') client.handshake.auth.tenantId = 'invalid';
    if (reason === 'inactive') memberships.findByUserId.mockResolvedValue({ isActive: false });
    if (reason === 'missing membership') memberships.findByUserId.mockResolvedValue(null);
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });
  it('joins only the authenticated tenant/user room and emits no content', async () => {
    const { memberships, gateway, client } = setup();
    await gateway.handleConnection(client as any);
    expect(memberships.findByUserId).toHaveBeenCalledWith(tenantId, 'u');
    expect(client.join).toHaveBeenCalledWith(`tenant_${tenantId}:user_u`);
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    gateway.server = { to } as any;
    gateway.handleInAppMessage({ tenantId, userId: 'u', title: 'secret', message: 'secret' } as any);
    expect(to).toHaveBeenCalledWith(`tenant_${tenantId}:user_u`);
    expect(emit).toHaveBeenCalledWith('notifications.changed', { tenantId });
  });
});
