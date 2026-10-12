import { CustomersRepository } from '../customers.repository';
import { CustomersService } from '../customers.service';
import { Prisma } from 'src/generated/prisma/client';

const input = {
  name: 'Incoming',
  email: 'incoming@example.test',
  phoneCountryCode: '598',
  phoneNumber: '99123456',
  notes: 'Incoming note',
};
const stored = {
  id: 'customer',
  tenantId: 'tenant',
  name: 'Stored',
  email: 'stored@example.test',
  phoneCountryCode: '598',
  phoneNumber: '99123456',
  notes: 'PRIVATE',
  emailVerifiedAt: new Date(),
  phoneVerifiedAt: new Date(),
  deletedAt: null,
};

describe('early public customer identity', () => {
  it('reuses a stored customer without updating any of its details, including deleted identities', async () => {
    const customer = { ...stored, deletedAt: new Date() };
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: customer.id }]),
      customer: { findUniqueOrThrow: jest.fn().mockResolvedValue(customer), upsert: jest.fn(), update: jest.fn() },
    };
    const repository = new CustomersRepository(prisma as never);
    expect(await repository.findOrCreatePublic('tenant', input)).toBe(customer);
    expect(prisma.customer.update).not.toHaveBeenCalled();
    expect(prisma.customer.upsert).not.toHaveBeenCalled();
  });

  it('normalizes public phone identity before persistence', async () => {
    const repository = { findOrCreatePublic: jest.fn().mockResolvedValue(stored) };
    const service = new CustomersService(repository as never);
    await service.findPublicByPhoneOrCreate('tenant', { ...input, phoneCountryCode: '+598', phoneNumber: '99 123-456' });
    expect(repository.findOrCreatePublic).toHaveBeenCalledWith('tenant', input);
  });

  it('concurrent unique-key losers reuse the winner without replacing its name, notes or contacts', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: 'test' });
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      customer: {
        upsert: jest.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce(stored),
        findUniqueOrThrow: jest.fn().mockResolvedValue(stored),
        update: jest.fn(),
      },
    };
    const repository = new CustomersRepository(prisma as never);
    const results = await Promise.all([
      repository.findOrCreatePublic('tenant', input),
      repository.findOrCreatePublic('tenant', { ...input, name: 'Other' }),
    ]);
    expect(results).toEqual([stored, stored]);
    expect(prisma.customer.update).not.toHaveBeenCalled();
    for (const [params] of prisma.customer.upsert.mock.calls) expect(params.update).toEqual({});
  });
});

describe('administrative contact changes', () => {
  function fixture() {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn(),
      customer: { findUniqueOrThrow: jest.fn().mockResolvedValue(stored), update: jest.fn() },
      verification: { updateMany: jest.fn() },
    };
    const prisma = { $transaction: jest.fn(async (fn) => fn(tx)) };
    return { tx, repository: new CustomersRepository(prisma as never) };
  }
  it.each([
    [{ email: 'changed@example.test' }, 'EMAIL', 'emailVerifiedAt'],
    [{ phoneNumber: '99000000' }, 'WHATSAPP', 'phoneVerifiedAt'],
    [{ phoneCountryCode: '54' }, 'WHATSAPP', 'phoneVerifiedAt'],
  ])('clears only affected verification and invalidates its challenges atomically: %j', async (data, type, field) => {
    const { tx, repository } = fixture();
    await repository.updateContacts('tenant', 'customer', data as never);
    expect(tx.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ [field as string]: null }) }),
    );
    expect(tx.verification.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 'tenant',
        recipientId: 'customer',
        type: { in: ['CUSTOMER_VERIFICATION_EMAIL', 'CUSTOMER_VERIFICATION_PHONE'] },
        OR: [expect.objectContaining({ channel: type })],
      }),
      data: { lockedAt: expect.any(Date), expiresAt: expect.any(Date) },
    });
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });
  it('keeps verification when only name and notes change or the contact is unchanged', async () => {
    const { tx, repository } = fixture();
    await repository.updateContacts('tenant', 'customer', { name: 'New name', notes: 'New notes', email: stored.email });
    expect(tx.verification.updateMany).not.toHaveBeenCalled();
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'New name', notes: 'New notes', email: stored.email } }),
    );
  });
});
