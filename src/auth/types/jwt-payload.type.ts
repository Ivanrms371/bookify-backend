import { JwtPayload } from 'jsonwebtoken';

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  tokenVersion: number;
};

export type RefreshTokenPayload = JwtPayload & {
  jti: string;
  tokenVersion: number;
};
