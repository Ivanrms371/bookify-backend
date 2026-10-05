/// <reference types="jest" />
import { TeamService } from '../team.service';
import { ProfessionalsService } from '../../professionals/professionals.service';
import { ProfessionalsRepository } from '../../professionals/professionals.repository';
import { InvitationsService } from '../../invitations/invitations.service';
import { InvitationsRepository } from '../../invitations/invitations.repository';
import { MembershipsService } from '../../memberships/memberships.service';
import { MembershipsRepository } from '../../memberships/memberships.repository';
export function accessFixture(status = 'NONE', role = 'STAFF') {
  const state: any = {
    professional: {
      id: 'p',
      tenantId: 't',
      userId: ['ACTIVE', 'DISABLED'].includes(status) ? 'u' : null,
      name: 'Alex',
      email: 'business@example.com',
      phoneNumber: '123456',
      phoneCountryCode: '598',
      isActive: true,
      deletedAt: null,
    },
    users: [{ id: 'u', email: 'account@example.com' }],
    memberships: [
      { id: 'actor', userId: 'manager', tenantId: 't', role: 'OWNER', isActive: true },
      ...(['ACTIVE', 'DISABLED'].includes(status) ? [{ id: 'm', userId: 'u', tenantId: 't', role, isActive: status === 'ACTIVE' }] : []),
    ],
    invitations: ['PENDING', 'EXPIRED'].includes(status)
      ? [
          {
            id: 'i',
            tenantId: 't',
            professionalId: 'p',
            email: 'business@example.com',
            role: 'STAFF',
            token: 'old',
            expiresAt: new Date(Date.now() + (status === 'PENDING' ? 100000 : -100000)),
            revokedAt: null,
            acceptedAt: null,
            createdAt: new Date(),
            tenant: { id: 't', name: 'Business', slug: 'target' },
          },
        ]
      : [],
    assignments: [{ professionalId: 'p', serviceId: 'inactive', isActive: false }],
    services: [
      { id: 'inactive', tenantId: 't', isActive: false, deletedAt: null },
      { id: 'active', tenantId: 't', isActive: true, deletedAt: null },
    ],
  };
  const matches = (i: any, w: any) => Object.entries(w).every(([k, v]: any) => (k === 'expiresAt' ? i[k] > v.gt : i[k] === v));
  const tx: any = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    professional: {
      findUnique: jest.fn(async ({ where }) =>
        state.professional.id === where.id && state.professional.tenantId === where.tenantId && !state.professional.deletedAt
          ? { ...state.professional }
          : null,
      ),
      findFirst: jest.fn(async ({ where }) => (state.professional.userId === where.userId ? { ...state.professional } : null)),
      update: jest.fn(async ({ data }) => {
        for (const [k, v] of Object.entries(data)) if (v !== undefined) state.professional[k] = v;
        if (data.user?.connect) state.professional.userId = data.user.connect.id;
        return { ...state.professional };
      }),
    },
    membership: {
      delete: jest.fn(async ({ where }) => {
        const index = state.memberships.findIndex((m: any) => m.id === where.id && m.tenantId === where.tenantId);
        if (index < 0) throw new Error('Membership not found');
        return state.memberships.splice(index, 1)[0];
      }),
      findFirst: jest.fn(
        async ({ where }) => state.memberships.find((m: any) => m.tenantId === where.tenantId && m.userId === where.userId) ?? null,
      ),
      create: jest.fn(async ({ data }) => {
        const m = { ...data, isActive: true, id: 'new' };
        state.memberships.push(m);
        return m;
      }),
      update: jest.fn(async ({ where, data }) =>
        Object.assign(
          state.memberships.find((m: any) => m.id === where.id),
          data,
        ),
      ),
    },
    user: { findUnique: jest.fn(async ({ where }) => state.users.find((u: any) => u.id === where.id) ?? null) },
    invitation: {
      findFirst: jest.fn(async ({ where }) => state.invitations.find((i: any) => matches(i, where)) ?? null),
      findUnique: jest.fn(async ({ where }) => state.invitations.find((i: any) => matches(i, where)) ?? null),
      create: jest.fn(async ({ data }) => {
        const i = {
          ...data,
          id: 'new',
          tenantId: data.tenant.connect.id,
          professionalId: data.professional.connect.id,
          revokedAt: null,
          acceptedAt: null,
          createdAt: new Date(),
          tenant: { id: 't', name: 'Business', slug: 'target' },
        };
        state.invitations.unshift(i);
        return i;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        const found = state.invitations.filter((i: any) => matches(i, where));
        found.forEach((i: any) => Object.assign(i, data));
        return { count: found.length };
      }),
      update: jest.fn(async ({ where, data }) =>
        Object.assign(
          state.invitations.find((i: any) => matches(i, where)),
          data,
        ),
      ),
    },
    service: {
      findMany: jest.fn(async ({ where }) =>
        state.services.filter(
          (s: any) =>
            where.id.in.includes(s.id) && s.tenantId === where.tenantId && !s.deletedAt && (s.isActive || where.OR[1].id.in.includes(s.id)),
        ),
      ),
    },
    serviceAssignment: {
      findMany: jest.fn(async () => [...state.assignments]),
      deleteMany: jest.fn(async () => {
        state.assignments = [];
      }),
      createMany: jest.fn(async ({ data }) => {
        state.assignments.push(...data);
      }),
    },
  };
  // Serialize fixture transactions as the tenant row lock does; snapshot rollback.
  let queue = Promise.resolve();
  const prisma: any = {
    ...tx,
    $transaction: jest.fn((fn) => {
      const result = queue.then(async () => {
        const before = structuredClone(state);
        try {
          return await fn(tx);
        } catch (e) {
          Object.assign(state, before);
          throw e;
        }
      });
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    }),
  };
  const memberships = new MembershipsService(new MembershipsRepository(prisma));
  const professionals = new ProfessionalsService(prisma, new ProfessionalsRepository(prisma), {} as never);
  const emitter = { emitAsync: jest.fn().mockResolvedValue([]) };
  const invitations = new InvitationsService(
    new InvitationsRepository(prisma),
    { findById: async () => ({ name: 'Business' }) } as never,
    { findByEmail: jest.fn().mockResolvedValue(null) } as never,
    memberships,
    professionals,
    prisma,
    emitter as never,
  );
  const team = new TeamService(memberships, invitations, professionals, prisma);
  return { state, tx, prisma, team, invitations, emitter, professionals };
}
