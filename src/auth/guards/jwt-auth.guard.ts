import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../infrastructure/jwt/jwt.service';
import { UsersService } from 'src/modules/users/users.service';
import { AuthenticatedRequest } from '../types/express-request.type';
import { AuthCookieService } from '../infrastructure/cookies/auth-cookie.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly authCookieService: AuthCookieService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.authCookieService.getAccessTokenCookie(req);
    const deviceId = this.authCookieService.getDeviceIdCookie(req);
    if (!token || !deviceId) {
      throw new UnauthorizedException('Inicia sesion nuevamente');
    }
    try {
      const payload = this.jwtService.validateAccessToken(token);
      const user = await this.usersService.findUserById(payload.sub);

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
