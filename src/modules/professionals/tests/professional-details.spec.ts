/// <reference types="jest" />
import { ProfessionalsService } from '../professionals.service';

describe('Professional contact and access detail contracts', () => {
  function setup(status: string, role = 'STAFF', viewerRole = 'OWNER', viewerId = 'manager') {
    const linked = ['ACTIVE', 'DISABLED'].includes(status);
    const professional = {
      id: 'p',
      avatarUrl: 'https://example.com/photo.webp',
      avatarPublicId: 't/avatar/photo',
      colorTheme: 'bg-pink-300',
      name: 'Business name',
      email: 'business@example.com',
      phoneNumber: '123456',
      phoneCountryCode: '598',
      userId: linked ? 'u' : null,
      user: linked
        ? {
            name: 'Account name',
            email: 'account@example.com',
            phoneNumber: '99999',
            phoneCountryCode: '1',
            memberships: [{ role, isActive: status === 'ACTIVE' }],
          }
        : null,
      assignments: [{ serviceId: 's', isActive: false, service: { name: 'Inactive assignment', isActive: true, deletedAt: null } }],
      invitations: ['PENDING', 'EXPIRED'].includes(status)
        ? [
            {
              token: 'secret',
              email: 'recipient@example.com',
              role,
              expiresAt: new Date(Date.now() + (status === 'PENDING' ? 60000 : -60000)),
            },
          ]
        : [],
    };
    const repository = {
      findByIdWithDetails: jest.fn().mockResolvedValue(professional),
      findMany: jest.fn().mockResolvedValue({ data: [professional], meta: {} }),
    };
    const service = new ProfessionalsService({} as never, repository as never, {} as never);
    return { service, viewer: { id: viewerId, role: viewerRole } as any };
  }
  it.each(['NONE', 'PENDING', 'EXPIRED', 'ACTIVE', 'DISABLED'])(
    'returns %s metadata without invitation tokens or account contact overrides',
    async (status) => {
      const f = setup(status);
      const result = await f.service.getByIdWithDetails('t', 'p', f.viewer);
      expect(result).toMatchObject({
        avatarUrl: 'https://example.com/photo.webp',
        avatarPublicId: 't/avatar/photo',
        colorTheme: 'bg-pink-300',
        name: 'Business name',
        email: 'business@example.com',
        phoneNumber: '123456',
        phoneCountryCode: '598',
        access: { status },
      });
      expect(result.assignedServices).toEqual([{ id: 's', name: 'Inactive assignment', isActive: false }]);
      expect(JSON.stringify(result)).not.toContain('secret');
      if (['ACTIVE', 'DISABLED'].includes(status)) expect(result.access.accountEmail).toBe('account@example.com');
    },
  );
  it.each([
    ['OWNER', 'OWNER', 'manager'],
    ['ADMIN', 'ADMIN', 'manager'],
    ['ADMIN', 'OWNER', 'u'],
  ])('marks protected access for role %s viewer %s id %s', async (role, viewerRole, id) => {
    const f = setup('ACTIVE', role, viewerRole, id);
    expect((await f.service.getByIdWithDetails('t', 'p', f.viewer)).access.canChange).toBe(false);
  });
  it('lists tenant-owned contact fields for linked professionals', async () => {
    const f = setup('ACTIVE');
    const result: any = await f.service.findAll('t', {});
    expect(result[0]).toMatchObject({ email: 'business@example.com', phoneNumber: '123456', phoneCountryCode: '598' });
  });
});
