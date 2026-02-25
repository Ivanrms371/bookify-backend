import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';
import { CookieName } from 'src/common/constants/cookie.constants';
import { Time } from 'src/common/constants/time.constants';

@Injectable()
export class AuthCookieService {
  private readonly isProduction: boolean;
  private readonly domain: string;

  private readonly accessTokenCookieMaxAge: number = Time.HOUR;
  private readonly refreshTokenCookieMaxAge: number = Time.DAY * 30;
  private readonly deviceIdCookieMaxAge: number = Time.DAY * 365;

  private readonly accessTokenCookiePath: string = '/api';
  private readonly refreshTokenCookiePath: string = '/api/auth/refresh';
  private readonly deviceIdCookiePath: string = '/api';

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.domain = this.configService.get<string>('COOKIE_DOMAIN')!;
  }

  private getBaseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      domain: this.domain,
    };
  }

  setAccessTokenCookie(res: Response, token: string) {
    res.cookie(CookieName.ACCESS_TOKEN, token, {
      ...this.getBaseCookieOptions(),
      path: this.accessTokenCookiePath,
      maxAge: this.accessTokenCookieMaxAge,
    });
  }

  setRefreshTokenCookie(res: Response, token: string) {
    res.cookie(CookieName.REFRESH_TOKEN, token, {
      ...this.getBaseCookieOptions(),
      path: this.refreshTokenCookiePath,
      maxAge: this.refreshTokenCookieMaxAge,
    });
  }

  setDeviceIdCookie(res: Response, deviceId: string) {
    res.cookie(CookieName.DEVICE_ID, deviceId, {
      ...this.getBaseCookieOptions(),
      path: this.deviceIdCookiePath,
      maxAge: this.deviceIdCookieMaxAge,
    });
  }

  getAccessTokenCookie(req: Request): string {
    return req.cookies[CookieName.ACCESS_TOKEN];
  }

  getRefreshTokenCookie(req: Request): string {
    return req.cookies[CookieName.REFRESH_TOKEN];
  }

  getDeviceIdCookie(req: Request): string {
    return req.cookies[CookieName.DEVICE_ID];
  }

  clearAccessTokenCookie(res: Response) {
    res.clearCookie(CookieName.ACCESS_TOKEN, {
      path: this.accessTokenCookiePath,
      domain: this.domain,
    });
  }

  clearRefreshTokenCookie(res: Response) {
    res.clearCookie(CookieName.REFRESH_TOKEN, {
      path: this.refreshTokenCookiePath,
      domain: this.domain,
    });
  }

  clearDeviceIdCookie(res: Response) {
    res.clearCookie(CookieName.DEVICE_ID, {
      path: this.deviceIdCookiePath,
      domain: this.domain,
    });
  }
}
