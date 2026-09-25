import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from 'src/auth/infrastructure/jwt/jwt.service';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AuthenticatedRequest, AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';
import { SessionsService } from 'src/auth/sessions/sessions.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private sessionCache = new Map<string, { user: AuthenticatedUser; expires: number }>();
  private readonly TTL = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cookieService: CookieService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.cookieService.getOrFail(req, COOKIE_KEYS.ACCESS_TOKEN);

    try {
      const payload = this.jwtService.validateAccessToken(token);

      const now = Date.now();
      const cached = this.sessionCache.get(payload.sub);

      let user: AuthenticatedUser | null = null;

      if (cached && now < cached.expires) {
        user = cached.user;
      } else {
        const dbUser = await this.prisma.user.findUnique({
          where: {
            id: payload.sub,
          },
          select: {
            id: true,
            name: true,
            email: true,
            tokenVersion: true,
          },
        });

        const session = await this.sessionsService.findByJti(payload.jti);

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          throw new UnauthorizedException('Invalid session');
        }

        if (dbUser && dbUser.tokenVersion !== payload.tokenVersion) {
          throw new UnauthorizedException('Invalid session');
        }

        if (dbUser) {
          user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, jti: payload.jti };
          this.sessionCache.set(payload.sub, { user, expires: now + this.TTL });
        }
      }
      if (!user) {
        throw new UnauthorizedException('Invalid session');
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        jti: user.jti,
      };
      return true;
    } catch (error) {
      console.log(error.stack);
      throw new UnauthorizedException(error.message || 'An error has ocurred, try sign in again');
    }
  }
}
