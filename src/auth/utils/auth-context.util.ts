import { Request } from 'express';
import { AuthContext } from '../types/auth-context.type';

export function createAuthContext(req: Request): AuthContext {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;

  const userAgent = req.headers['user-agent'] || 'Unknown User Agent';

  return {
    ip: Array.isArray(ip) ? ip[0] : ip,
    userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent,
  };
}
