import { VerificationsService } from '../core/verifications.service';
function fixture() {
  const record = {
    id: 'v',
    type: 'USER_EMAIL_VERIFICATION',
    recipientId: 'u',
    recipientType: 'USER',
    verifiedAt: null,
    lockedAt: null,
    expiresAt: new Date(Date.now() + 100000),
  };
  const verification = {
    findFirst: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn(),
    create: jest.fn(({ data }: { data: Partial<typeof record> }) => Promise.resolve({ ...record, ...data })),
    findUnique: jest.fn().mockResolvedValue(record),
    update: jest.fn(),
  };
  const users = { findById: jest.fn().mockResolvedValue({ emailVerifiedAt: null }), markEmailAsVerified: jest.fn() };
  const tx = { verification: verification };
  const prisma = { verification: verification, $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)) };
  const events = { emit: jest.fn() };
  return {
    service: new VerificationsService(prisma as never, users as never, events as never),
    verification,
    users,
    events,
    record,
    tx,
  };
}
it('retains user email requests and password-reset link creation', async () => {
  for (const type of ['USER_EMAIL_VERIFICATION', 'PASSWORD_RESET'] as const) {
    const f = fixture();
    expect(await f.service.requestVerification({ type, recipientId: 'u', recipientType: 'USER' })).toEqual({ success: true });
    expect(f.events.emit).toHaveBeenCalledWith(
      'verification.created',
      expect.objectContaining({ type, token: expect.stringMatching(/^[a-f0-9]{64}$/) as unknown, recipientType: 'USER' }),
    );
  }
});
it('retains user email token completion', async () => {
  const f = fixture();
  await expect(f.service.verifyToken({ type: 'USER_EMAIL_VERIFICATION', token: 'secret' })).resolves.toMatchObject({
    success: true,
    recipientType: 'USER',
  });
  expect(f.users.markEmailAsVerified).toHaveBeenCalledWith('u', f.tx);
});
it('rejects customer requests and code verification outside the booking process', async () => {
  const f = fixture();
  await expect(
    f.service.requestVerification({ type: 'CUSTOMER_VERIFICATION_EMAIL', recipientId: 'c', recipientType: 'CUSTOMER', tenantId: 't' }),
  ).rejects.toThrow('pública');
  await expect(
    f.service.verifyCode({ type: 'CUSTOMER_VERIFICATION_EMAIL', recipientId: 'c', recipientType: 'CUSTOMER', code: '123456' }),
  ).rejects.toThrow('pública');
  expect(f.verification.findFirst).not.toHaveBeenCalled();
  expect(f.verification.deleteMany).not.toHaveBeenCalled();
});
it('rejects a customer magic link submitted to the generic user-token endpoint', async () => {
  const f = fixture();
  Object.assign(f.record, { recipientType: 'CUSTOMER', type: 'CUSTOMER_VERIFICATION_EMAIL' });
  await expect(f.service.verifyToken({ type: 'CUSTOMER_VERIFICATION_EMAIL', token: 'secret' })).rejects.toThrow('pública');
  expect(f.verification.update).not.toHaveBeenCalled();
});
