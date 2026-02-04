import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthContext } from '../types/auth-context.type';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshTokenPayload } from '../types/jwt-payload.type';
import { UserService } from 'src/modules/users/services/user.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private readonly thirtyDaysInMs = 1000 * 60 * 60 * 24 * 30;

  async createRefreshToken(userId: string, token: string, jti: string, ctx: AuthContext) {
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash(token, salt);
    const { ip, userAgent } = ctx;

    const expiresAt = new Date(Date.now() + this.thirtyDaysInMs);
    const lastUsedAt = new Date();

    return this.refreshTokenRepository.create({
      jti,
      userId,
      expiresAt,
      lastUsedAt,
      userAgent: userAgent ?? null,
      token: tokenHash,
      ipAddress: ip ?? null,
    });
  }

  async validateRefreshToken(jti: string, token: string) {
    const refreshToken = await this.refreshTokenRepository.findTokenByJti(jti);
    if (!refreshToken) {
      throw new NotFoundException('token_not_found');
    }
    const isTokenValid = await bcrypt.compare(token, refreshToken.token);
    if (!isTokenValid) {
      throw new UnauthorizedException('invalid_token');
    }
    if (refreshToken.revokedAt) {
      throw new UnauthorizedException('token_revoked');
    }
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('token_expired');
    }
    return refreshToken;
  }

  async validateUserAndVersion(userId: string, version: number) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('user_not_found');
    }
    if (user.tokenVersion !== version) {
      throw new UnauthorizedException('token_version_mismatch');
    }
    return user;
  }

  async refresh(token: string, payload: RefreshTokenPayload) {
    const { jti, tokenVersion } = payload;
    const refreshToken = await this.validateRefreshToken(jti, token);
    const user = await this.validateUserAndVersion(refreshToken.userId, tokenVersion);
    return user;
  }

  async revoke(token: string, payload: RefreshTokenPayload) {
    const { jti, tokenVersion } = payload;
    const refreshToken = await this.validateRefreshToken(jti, token);
    await this.validateUserAndVersion(refreshToken.userId, tokenVersion);
    await this.refreshTokenRepository.revoke(refreshToken.id);
    return refreshToken;
  }

  async revokeAllTokens(token: string, payload: RefreshTokenPayload) {
    const { jti, tokenVersion } = payload;
    const refreshToken = await this.validateRefreshToken(jti, token);
    const user = await this.validateUserAndVersion(refreshToken.userId, tokenVersion);
    await this.revokeAllTokensByUserId(user.id);
    return user;
  }

  async revokeAllTokensByUserId(userId: string) {
    const user = await this.userService.update(userId, {
      tokenVersion: { increment: 1 },
    });
    await this.refreshTokenRepository.revokeAllTokens(userId);
    return user;
  }
}
