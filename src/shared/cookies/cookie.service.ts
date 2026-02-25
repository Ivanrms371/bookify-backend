import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

@Injectable()
export class CookieService {
  private readonly nodeEnv: string;
  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.getOrThrow<string>('NODE_ENV');
  }

  set(res: Response, key: string, value: string, options?: CookieOptions) {
    res.cookie(key, value, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'lax',
      ...options,
    });
  }

  get(req: Request, key: string): string | undefined {
    return req.cookies[key];
  }

  getOrFail(req: Request, key: string): string {
    const value = this.get(req, key);
    if (!value) {
      throw new Error(`Cookie ${key} not found`);
    }
    return value;
  }

  clear(res: Response, key: string) {
    res.clearCookie(key);
  }
}
