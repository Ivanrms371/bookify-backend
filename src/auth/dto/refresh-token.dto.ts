export type CreateRefreshTokenDto = {
  jti: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date;
  expiresAt: Date;
};
