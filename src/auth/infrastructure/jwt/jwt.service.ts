import * as jwt from 'jsonwebtoken';
import { Jwt } from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenPayload } from './jwt.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  /* Secrets */
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  /* Expirations */
  private readonly accessTokenExpiresIn: jwt.SignOptions['expiresIn'];
  private readonly refreshTokenExpiresIn: jwt.SignOptions['expiresIn'];

  constructor(private readonly configService: ConfigService) {
    this.accessTokenSecret = this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET');
    this.refreshTokenSecret = this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET');
    this.accessTokenExpiresIn = (this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') ?? '1h') as jwt.SignOptions['expiresIn'];
    this.refreshTokenExpiresIn = (this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') ?? '30d') as jwt.SignOptions['expiresIn'];
  }

  validateAccessToken(accessToken: string): TokenPayload {
    const decoded = jwt.verify(accessToken, this.accessTokenSecret);
    if (!decoded) {
      throw new UnauthorizedException('Un error ha ocurrido, inicia sesión nuevamente');
    }
    return decoded as TokenPayload;
  }

  signAccessToken(payload: TokenPayload) {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  validateRefreshToken(refreshToken: string): TokenPayload {
    const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
    if (!decoded) {
      throw new UnauthorizedException('Un error ha ocurrido, inicia sesión nuevamente');
    }
    return decoded as TokenPayload;
  }

  signRefreshToken(payload: TokenPayload) {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }
}
