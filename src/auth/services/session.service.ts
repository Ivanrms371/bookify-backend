import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { JwtService } from './jwt.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuthContext } from '../types/auth-context.type';
import { BusinessService } from 'src/modules/businesses/services/business.service';
import { randomUUID } from 'crypto';

export type UserSessionData = {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    phone: string | null;
    businessId: string | null;
    lastLoginAt: Date | null;
    businessStatus: {
      isOnboardingCompleted: boolean | undefined;
      logoUrl: string | null | undefined;
      coverUrl: string | null | undefined;
    };
  };
};

export type UserSession = UserSessionData & {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class SessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly businessService: BusinessService,
  ) {}

  /**
   * Generate a complete user session (access token + refresh token + user data)
   */
  async generateUserSession(user: User, ctx: AuthContext): Promise<UserSession> {
    const userData = await this.getUserContext(user);

    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });

    const jti = randomUUID();
    const refreshToken = await this.jwtService.signRefreshToken({
      jti,
      tokenVersion: user.tokenVersion,
    });

    await this.refreshTokenService.createRefreshToken(user.id, refreshToken, jti, ctx);

    return { accessToken, refreshToken, ...userData };
  }

  /**
   * Get user context data (business info, etc.)
   * This method fetches relational data from the DB based on userId
   */
  async getUserContext(user: User): Promise<UserSessionData> {
    const business = await this.businessService.findByOwnerId(user.id);

    return {
      isAuthenticated: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessId: business?.id ?? null,
        lastLoginAt: user.lastLoginAt,
        businessStatus: {
          isOnboardingCompleted: business?.onboardingCompleted,
          logoUrl: business?.logoUrl,
          coverUrl: business?.coverUrl,
        },
      },
    };
  }
}
