/// <reference types="jest" />
import { AuthService } from '../services/auth.service';
import { AuthController } from '../auth.controller';
import { AuthCallbackHandler } from '../services/auth-callback.handler';
import { createOAuthContext, readOAuthContext, OAUTH_CONTEXT_COOKIE } from '../services/oauth-context';
import { sign } from 'jsonwebtoken';
import { VerificationCreatedListener } from 'src/modules/notifications/listeners/verifications/verification-created.listener';
import { TenantGuard } from 'src/common/security/guards/tenant.guard';

jest.mock('src/modules/notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));

function setup() {
  const state: any = { users: [], target: null };
  let committed = false;
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: { findUnique: jest.fn(async ({ where }: any) => state.users.find((u: any) => u.googleId === where.googleId) ?? null) },
  };
  const prisma = {
    $transaction: jest.fn(async (fn) => {
      const before = structuredClone(state);
      try {
        const r = await fn(tx);
        committed = true;
        return r;
      } catch (e) {
        Object.assign(state, before);
        throw e;
      }
    }),
  };
  const users = {
    findByEmail: jest.fn(async (email) => state.users.find((u: any) => u.email === email) ?? null),
    findByEmailOrFail: jest.fn(async (email) => state.users.find((u: any) => u.email === email)),
    create: jest.fn(async (data) => {
      const user = { id: 'u', tokenVersion: 0, ...data };
      state.users.push(user);
      return user;
    }),
    update: jest.fn(async (id, data) =>
      Object.assign(
        state.users.find((u: any) => u.id === id),
        data,
      ),
    ),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    findMeById: jest.fn(async (_, tenantId) => ({
      id: 'u',
      email: 'invite@example.com',
      activeTenant: tenantId ? { id: tenantId, slug: 'invited' } : null,
    })),
  };
  const invitation = { id: 'i', tenantId: 'target', email: 'invite@example.com', token: 'token' };
  const invitations = {
    findValidInvitationOrThrow: jest.fn().mockResolvedValue(invitation),
    acceptWithTx: jest.fn(async () => {
      state.target = 'target';
      return { tenantId: 'target', tenantSlug: 'invited' };
    }),
  };
  const sessions = {
    createOrRefreshSession: jest.fn(async () => {
      expect(committed || state.users[0]).toBeTruthy();
      return { jti: 'jti', deviceId: 'device' };
    }),
  };
  const jwt = { signAccessToken: jest.fn().mockReturnValue('access'), signRefreshToken: jest.fn().mockReturnValue('refresh') };
  const passwords = { hash: jest.fn().mockResolvedValue('hash'), compare: jest.fn().mockResolvedValue(true) };
  const verifications = { requestVerification: jest.fn().mockResolvedValue({ success: true }) };
  const auth = new AuthService(
    prisma as never,
    users as never,
    sessions as never,
    jwt as never,
    passwords as never,
    verifications as never,
    invitations as never,
  );
  return { auth, state, tx, prisma, users, invitations, sessions, jwt, passwords, verifications };
}
const signup = {
  name: 'Recipient',
  email: 'INVITE@example.com',
  phoneCountryCode: '598',
  phoneNumber: '123456',
  password: 'password123',
  token: 'token',
};
const google = { googleId: 'google', email: 'invite@example.com', name: 'Recipient', emailVerifiedAt: new Date() };

describe('Invited signup and Google authentication', () => {
  it('invited password signup establishes a session after transactional acceptance with target tenant context', async () => {
    const f = setup();
    const result = await f.auth.signup({ ...signup });
    expect(result).toMatchObject({ requiresEmailVerification: false, tenantId: 'target', session: { accessToken: 'access' } });
    expect(f.invitations.acceptWithTx).toHaveBeenCalledWith(f.tx, expect.objectContaining({ token: 'token' }), 'u', 'invite@example.com');
    expect(f.state.users[0]).toMatchObject({ email: 'invite@example.com', emailVerifiedAt: expect.any(Date) });
    expect(f.verifications.requestVerification).not.toHaveBeenCalled();
  });
  it('ordinary signup retains verification and creates no authenticated session', async () => {
    const f = setup();
    await expect(f.auth.signup({ ...signup, token: undefined })).resolves.toMatchObject({ requiresEmailVerification: true });
    expect(f.verifications.requestVerification).toHaveBeenCalledTimes(1);
    expect(f.sessions.createOrRefreshSession).not.toHaveBeenCalled();
    expect(f.invitations.acceptWithTx).not.toHaveBeenCalled();
  });
  it.each(['wrong recipient', 'acceptance conflict'])('rolls back invited signup on %s before creating a session', async (reason) => {
    const f = setup();
    if (reason === 'acceptance conflict') f.invitations.acceptWithTx.mockRejectedValue(new Error('conflict'));
    await expect(f.auth.signup({ ...signup, email: reason === 'wrong recipient' ? 'wrong@example.com' : signup.email })).rejects.toThrow();
    expect(f.state.users).toHaveLength(0);
    expect(f.sessions.createOrRefreshSession).not.toHaveBeenCalled();
  });
  it('invited Google consumes in the account transaction then returns the invited tenant navigation', async () => {
    const f = setup();
    await expect(f.auth.loginOrCreateFromGoogle(google, 'device', 'token')).resolves.toMatchObject({
      accessToken: 'access',
      redirectPath: '/invited',
    });
    expect(f.invitations.acceptWithTx).toHaveBeenCalledWith(f.tx, expect.objectContaining({ token: 'token' }), 'u', 'invite@example.com');
    expect(f.users.findMeById).toHaveBeenCalledWith('u', 'target');
  });
  it.each(['unverified email', 'wrong recipient', 'conflict'])(
    'denies Google %s before establishing session or retaining account writes',
    async (reason) => {
      const f = setup();
      if (reason === 'conflict') f.invitations.acceptWithTx.mockRejectedValue(new Error('conflict'));
      const info = {
        ...google,
        ...(reason === 'unverified email' ? { emailVerifiedAt: undefined } : {}),
        ...(reason === 'wrong recipient' ? { email: 'wrong@example.com' } : {}),
      };
      await expect(f.auth.loginOrCreateFromGoogle(info, 'device', 'token')).rejects.toThrow();
      expect(f.state.users).toHaveLength(0);
      expect(f.sessions.createOrRefreshSession).not.toHaveBeenCalled();
    },
  );
  it('rolls back existing account Google linking when invitation consumption fails', async () => {
    const f = setup();
    f.state.users.push({ id: 'u', email: 'invite@example.com', googleId: null, tokenVersion: 0 });
    f.invitations.acceptWithTx.mockRejectedValue(new Error('conflict'));
    await expect(f.auth.loginOrCreateFromGoogle(google, 'device', 'token')).rejects.toThrow();
    expect(f.state.users[0].googleId).toBeNull();
    expect(f.sessions.createOrRefreshSession).not.toHaveBeenCalled();
  });
  it('ordinary Google sign-in uses normal context and does not consume an invitation', async () => {
    const f = setup();
    f.users.findMeById.mockResolvedValue({ id: 'u', email: 'invite@example.com', activeTenant: { id: 'ordinary', slug: 'ordinary' } });
    await expect(f.auth.loginOrCreateFromGoogle(google, 'device')).resolves.toMatchObject({ redirectPath: '/ordinary' });
    expect(f.invitations.acceptWithTx).not.toHaveBeenCalled();
  });
  it('password login remains independent of invitation validation', async () => {
    const f = setup();
    f.state.users.push({ id: 'u', email: 'invite@example.com', emailVerifiedAt: new Date(), password: 'hash', tokenVersion: 0 });
    await expect(f.auth.login({ email: 'invite@example.com', password: 'pass' })).resolves.toMatchObject({ accessToken: 'access' });
    f.state.users[0].emailVerifiedAt = null;
    await expect(f.auth.login({ email: 'invite@example.com', password: 'pass' })).rejects.toMatchObject({
      status: 403,
    });
    expect(f.verifications.requestVerification).toHaveBeenCalledWith({
      recipientId: 'u',
      recipientType: 'USER',
      type: 'USER_EMAIL_VERIFICATION',
    });
    expect(f.invitations.findValidInvitationOrThrow).not.toHaveBeenCalled();
  });
  it('OAuth callback handler carries invitation context through mocked provider calls', async () => {
    const f = setup();
    const provider = {
      exchange: jest.fn().mockResolvedValue({ access_token: 'provider' }),
      getUserInfo: jest.fn().mockResolvedValue(google),
    };
    const handler = new AuthCallbackHandler(f.auth, provider as never);
    await expect(handler.handleGoogleOAuthCallback({ code: 'code', deviceId: 'device', invitationToken: 'token' })).resolves.toMatchObject({
      redirectPath: '/invited',
    });
    expect(provider.getUserInfo).toHaveBeenCalledWith('provider');
  });
});

describe('OAuth signed browser context', () => {
  const secret = 'test-auth-secret';
  it('uses a random nonce, signs context for ten minutes and verifies it', () => {
    const first = createOAuthContext(secret, { deviceId: 'device', invitationToken: 'token' });
    const second = createOAuthContext(secret, { deviceId: 'device', invitationToken: 'token' });
    expect(first.nonce).not.toBe(second.nonce);
    const decoded = readOAuthContext(secret, first.cookie, first.nonce) as any;
    expect(decoded).toMatchObject({ deviceId: 'device', invitationToken: 'token' });
    expect(decoded.exp - decoded.iat).toBe(600);
  });
  it.each(['tampered', 'expired', 'wrong purpose', 'wrong nonce', 'missing state'])('rejects %s context', (kind) => {
    const context = createOAuthContext(secret, {});
    let cookie = context.cookie;
    if (kind === 'tampered') cookie = cookie.slice(0, -10) + 'tampered';
    if (kind === 'expired') cookie = sign({ nonce: context.nonce }, secret, { audience: 'bookify:google-oauth-context', expiresIn: -1 });
    if (kind === 'wrong purpose') cookie = sign({ nonce: context.nonce }, secret, { audience: 'access-token' });
    expect(() =>
      readOAuthContext(secret, cookie, kind === 'wrong nonce' ? 'other' : kind === 'missing state' ? '' : context.nonce),
    ).toThrow();
  });
  function controller() {
    const config = { get: jest.fn().mockReturnValue('https://app.example'), getOrThrow: jest.fn().mockReturnValue(secret) };
    const cookies = { get: jest.fn((req, key) => req.cookies[key]), set: jest.fn() };
    const googleService = { getAuthorizationUrl: jest.fn().mockReturnValue('https://google.example/oauth') };
    const callback = {
      handleGoogleOAuthCallback: jest
        .fn()
        .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh', deviceId: 'device', redirectPath: '/invited' }),
    };
    const controller = new AuthController(config as never, {} as never, cookies as never, googleService as never, callback as never);
    const res = { send: jest.fn(), clearCookie: jest.fn(), redirect: jest.fn() };
    return { controller, cookies, googleService, callback, res };
  }
  it('sets a ten-minute cookie and sends only nonce as OAuth state', () => {
    const f = controller();
    f.controller.google({ cookies: {} } as any, f.res as any, 'token');
    const [_, key, cookie, options] = f.cookies.set.mock.calls[0];
    expect(key).toBe(OAUTH_CONTEXT_COOKIE);
    expect(options).toMatchObject({ maxAge: 600000, path: '/api/auth/google' });
    expect(readOAuthContext(secret, cookie, f.googleService.getAuthorizationUrl.mock.calls[0][0])).toMatchObject({
      invitationToken: 'token',
    });
    expect(f.res.send).toHaveBeenCalledWith({ url: 'https://google.example/oauth' });
  });
  it('ignores unsigned callback token/device overrides, clears context and redirects to target after successful session', async () => {
    const f = controller();
    const context = createOAuthContext(secret, { invitationToken: 'real', deviceId: 'real-device' });
    await f.controller.googleCallback({ cookies: { [OAUTH_CONTEXT_COOKIE]: context.cookie } } as any, f.res as any, {
      code: 'code',
      state: context.nonce,
      invitationToken: 'attacker',
    });
    expect(f.callback.handleGoogleOAuthCallback).toHaveBeenCalledWith({ code: 'code', deviceId: 'real-device', invitationToken: 'real' });
    expect(f.res.clearCookie).toHaveBeenCalledWith(OAUTH_CONTEXT_COOKIE, { path: '/api/auth/google' });
    expect(f.res.redirect).toHaveBeenCalledWith('https://app.example/invited');
  });
  it('on invited failure establishes no cookies and returns to invitation screen', async () => {
    const f = controller();
    const context = createOAuthContext(secret, { invitationToken: 'real' });
    f.callback.handleGoogleOAuthCallback.mockRejectedValue(new Error('wrong account'));
    await f.controller.googleCallback({ cookies: { [OAUTH_CONTEXT_COOKIE]: context.cookie } } as any, f.res as any, {
      code: 'code',
      state: context.nonce,
      invitationToken: '',
    });
    expect(f.cookies.set).not.toHaveBeenCalled();
    expect(f.res.redirect).toHaveBeenCalledWith('https://app.example/auth/invitations?token=real&error=google');
  });
  it('state mismatch clears context and never calls Google', async () => {
    const f = controller();
    const context = createOAuthContext(secret, {});
    await f.controller.googleCallback({ cookies: { [OAUTH_CONTEXT_COOKIE]: context.cookie } } as any, f.res as any, {
      code: 'code',
      state: 'wrong',
      invitationToken: '',
    });
    expect(f.callback.handleGoogleOAuthCallback).not.toHaveBeenCalled();
    expect(f.cookies.set).not.toHaveBeenCalled();
    expect(f.res.clearCookie).toHaveBeenCalled();
  });
});

it('verification emails preserve invitation context without changing ordinary verification links', async () => {
  const notifications = { create: jest.fn() };
  const listener = new VerificationCreatedListener(
    notifications as never,
    { get: () => 'https://app.example' } as never,
    { findById: async () => ({ name: 'Recipient' }) } as never,
  );
  const event: any = {
    type: 'USER_EMAIL_VERIFICATION',
    recipientType: 'USER',
    recipientId: 'u',
    token: 'verification',
    invitationToken: 'invitation',
  };
  await listener.handle(event);
  expect(notifications.create.mock.calls[0][0].payload.confirmLink).toBe(
    'https://app.example/auth/verify?token=verification&type=USER_EMAIL_VERIFICATION&invitationToken=invitation',
  );
  await listener.handle({ ...event, invitationToken: undefined });
  expect(notifications.create.mock.calls[1][0].payload.confirmLink).not.toContain('invitationToken');
});

it('subsequent tenant requests deny deactivated membership without revoking global sessions', async () => {
  const prisma = {
    membership: { findUnique: jest.fn().mockResolvedValue({ isActive: false, role: 'STAFF', tenant: { slug: 'target' } }) },
  };
  const guard = new TenantGuard(prisma as never, { getAllAndOverride: () => false } as never);
  const req = { user: { id: 'u' }, headers: { 'x-tenant-id': '019a0000-0000-7000-8000-000000000001' } };
  const context = { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => req }) };
  await expect(guard.canActivate(context as any)).rejects.toMatchObject({ status: 403 });
});
