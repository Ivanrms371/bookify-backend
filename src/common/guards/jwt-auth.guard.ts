import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../auth/infrastructure/jwt/jwt.service';
import { AuthenticatedRequest } from '../../auth/types/express-request.type';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/modules/users/users.service';

interface UserSession {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tokenVersion: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private sessionCache = new Map<string, { user: UserSession; expires: number }>();
  private readonly TTL = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly cookieService: CookieService,
    private readonly jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.cookieService.getOrFail(req, COOKIE_KEYS.ACCESS_TOKEN);
    const deviceId = this.cookieService.getOrFail(req, COOKIE_KEYS.DEVICE_ID);

    try {
      const payload = this.jwtService.validateAccessToken(token);

      const now = Date.now();
      const cached = this.sessionCache.get(payload.sub);

      let user: UserSession | null = null;

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
            phone: true,
            tokenVersion: true,
          },
        });
        if (dbUser) {
          user = dbUser;
          this.sessionCache.set(payload.sub, { user, expires: now + this.TTL });
        }
      }
      if (!user) {
        throw new UnauthorizedException('Inicia sesion nuevamente');
      }
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Inicia sesion nuevamente');
      }
      req.user = {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tokenVersion: user.tokenVersion,
        jti: payload.jti,
        deviceId,
      };
      return true;
    } catch (error) {
      console.log(error.stack);
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}
