import { randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import type { OAuthContext } from '../types/oauth-context.type';
const purpose = 'bookify:google-oauth-context';
export const OAUTH_CONTEXT_COOKIE = 'google_oauth_context';
export function createOAuthContext(secret: string, context: Omit<OAuthContext, 'nonce'>) {
  const nonce = randomBytes(32).toString('hex');
  return { nonce, cookie: sign({ ...context, nonce }, secret, { audience: purpose, expiresIn: '10m', algorithm: 'HS256' }) };
}
export function readOAuthContext(secret: string, cookie: string, state: string): OAuthContext {
  const context = verify(cookie, secret, { audience: purpose, algorithms: ['HS256'] }) as OAuthContext;
  if (!state || context.nonce !== state) throw new Error('Estado de Google inválido.');
  return context;
}
