import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../auth/infrastructure/jwt/jwt.service';
import { AuthenticatedRequest } from '../../auth/types/express-request.type';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
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
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });
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
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}
