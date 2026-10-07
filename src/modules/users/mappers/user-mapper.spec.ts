import { MembershipRole, OnboardingStatus } from 'src/generated/prisma/enums';
import { MeUserMapper, RawUserContextResponse } from './user-mapper';

const membership = (id: string, timeZone: string | null): RawUserContextResponse['memberships'][number] => ({
  role: MembershipRole.OWNER,
  tenant: {
    id, name: id, slug: id, logoUrl: null, onboardingStatus: OnboardingStatus.COMPLETED,
    professionals: [], subscription: null, settings: timeZone ? { timeZone } : null,
  },
});

const user = (memberships: RawUserContextResponse['memberships']): RawUserContextResponse => ({
  id: 'user', name: 'Ana', email: 'ana@example.test', avatarUrl: null, memberships,
});

describe('session active tenant timezone', () => {
  it('reads the timezone from the preferred tenant settings', () => {
    const raw = user([membership('first', 'Asia/Tokyo'), membership('second', 'America/Montevideo')]);
    const session = MeUserMapper.toDomain(raw, 'second');
    expect(session.activeTenant?.id).toBe('second');
    expect(session.activeTenant?.timeZone).toBe('America/Montevideo');
  });

  it('uses the first active tenant settings when no preference is supplied', () => {
    expect(MeUserMapper.toDomain(user([membership('first', 'Asia/Tokyo')])).activeTenant?.timeZone).toBe('Asia/Tokyo');
  });

  it('does not substitute a timezone when the selected tenant has no settings', () => {
    expect(MeUserMapper.toDomain(user([membership('first', null)])).activeTenant?.timeZone).toBeNull();
  });

  it('retains the no-tenant session response', () => {
    expect(MeUserMapper.toDomain(user([])).activeTenant).toBeNull();
  });
});

describe('session permission contract', () => {
  it.each([MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.STAFF])('returns authoritative permissions for %s', (role) => {
    const selected = { ...membership('tenant', null), role };
    const permissions = MeUserMapper.toDomain(user([selected])).activeTenant?.permissions ?? [];
    expect(permissions).toContain('customer:create');
    expect(permissions.includes('billing:read')).toBe(role === MembershipRole.OWNER);
    expect(permissions.includes('professional:create')).toBe(role !== MembershipRole.STAFF);
    expect(permissions.includes('customer:update')).toBe(role !== MembershipRole.STAFF);
    expect(permissions.includes('appointment:read_others')).toBe(role !== MembershipRole.STAFF);
    expect(permissions.includes('appointment:create_others')).toBe(role !== MembershipRole.STAFF);
    expect(permissions.includes('tenant:update')).toBe(role !== MembershipRole.STAFF);
  });
});
