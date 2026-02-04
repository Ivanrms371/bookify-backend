import * as jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtService {
  constructor() {}

  /* Secrets */
  private readonly accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? '';
  private readonly refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET ?? '';

  /* Expirations */
  private readonly accessTokenExpiresIn = '30d';
  private readonly refreshTokenExpiresIn = '30d';

  async validateAccessToken(accessToken: string) {
    const decoded = jwt.verify(accessToken, this.accessTokenSecret);
    if (!decoded) {
      throw new UnauthorizedException('Un error ha ocurrido, inicia sesión nuevamente');
    }
    return decoded as AccessTokenPayload;
  }

  async signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  async validateRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
    if (!decoded) {
      throw new UnauthorizedException('Un error ha ocurrido, inicia sesión nuevamente');
    }
    return decoded as RefreshTokenPayload;
  }

  async signRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }
}
