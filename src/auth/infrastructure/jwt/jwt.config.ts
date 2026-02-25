import { JwtPayload } from 'jsonwebtoken';

export type TokenPayload = JwtPayload & {
  sub: string;
  jti: string;
  tokenVersion: number;
};
