/// <reference types="jest" />
import { JwtAuthGuard } from 'src/common/security/guards/jwt-auth.guard';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthCallbackHandler } from '../services/auth-callback.handler';
import { GoogleService } from '../infrastructure/google/google.service';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';
import { SKIP_TENANT_KEY } from 'src/common/security/decorators/skip-tenant.decorator';

jest.mock('src/modules/notifications/application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));

describe('POST /auth/logout', () => {
  let app: INestApplication;
  const auth = { logout: jest.fn() };
  const cookies = { clear: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    auth.logout.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AuthService, useValue: auth },
        { provide: CookieService, useValue: cookies },
        { provide: GoogleService, useValue: {} },
        { provide: AuthCallbackHandler, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    // Model the authenticated request provided by JwtAuthGuard.
    app.use((req, _res, next) => {
      req.user = { id: 'user-id', jti: 'current-session', name: 'Test', email: 'test@example.com' };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('revokes the authenticated session and clears both cookies before returning success', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(201).expect({ success: true });
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(auth.logout).toHaveBeenCalledWith('current-session');
    expect(cookies.clear).toHaveBeenCalledTimes(2);
    expect(cookies.clear).toHaveBeenCalledWith(expect.anything(), COOKIE_KEYS.ACCESS_TOKEN);
    expect(cookies.clear).toHaveBeenCalledWith(expect.anything(), COOKIE_KEYS.REFRESH_TOKEN);
  });

  it('does not report success when session revocation fails', async () => {
    auth.logout.mockRejectedValue(new Error('Session storage unavailable'));
    await request(app.getHttpServer()).post('/auth/logout').expect(500);
    expect(cookies.clear).not.toHaveBeenCalled();
  });

  it('does not require membership in a selected tenant', () => {
    expect(Reflect.getMetadata(SKIP_TENANT_KEY, AuthController.prototype.logout)).toBe(true);
  });
});

describe('logout session identity', () => {
  it('keeps separate session IDs for two devices belonging to the same user', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-id', name: 'Test', email: 'test@example.com', tokenVersion: 1 }) },
    };
    const cookies = { getOrFail: jest.fn((req) => req.token) };
    const jwt = { validateAccessToken: jest.fn((token) => ({ sub: 'user-id', jti: token, tokenVersion: 1 })) };
    const sessions = { findByJti: jest.fn().mockResolvedValue({ revokedAt: null, expiresAt: new Date(Date.now() + 60000) }) };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(prisma as never, cookies as never, jwt as never, sessions as never, reflector as never);
    const first = { token: 'first-session', user: { jti: '' } };
    const second = { token: 'second-session', user: { jti: '' } };
    const context = (req) => ({ getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => req }) });
    await guard.canActivate(context(first) as never);
    await guard.canActivate(context(second) as never);
    expect(first.user.jti).toBe('first-session');
    expect(second.user.jti).toBe('second-session');
    expect(sessions.findByJti).toHaveBeenCalledWith('second-session');
  });
});
