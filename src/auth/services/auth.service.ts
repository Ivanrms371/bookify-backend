import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SignupDto } from '../dto/signup.dto';
import { SessionsService } from 'src/auth/sessions/sessions.service';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '../infrastructure/jwt/jwt.service';
import type { GoogleUserInfo } from '../types/google-domain';
import { PasswordService } from './password.service';
import type { GenerateSessionPayload } from '../types/auth-session.type';
import { InvitationsService } from 'src/modules/invitations/invitations.service';
import { VerificationsService } from 'src/modules/verifications/core/verifications.service';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';

import { lockTenantAccess, lockProfessionalAccess } from 'src/common/database/access-lock';

import type { Invitation } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { AcceptedInvitationResponse } from 'src/modules/invitations/types/invitation-acceptance.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly verificationsService: VerificationsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async login(dto: LoginDto, deviceId?: string) {
    const user = await this.usersService.findByEmailOrFail(dto.email);

    if (!user.emailVerifiedAt) {
      await this.verificationsService.requestVerification({
        recipientId: user.id,
        recipientType: RecipientType.USER,
        type: VerificationType.USER_EMAIL_VERIFICATION,
      });
      throw new ForbiddenException('Hemos enviado un email para que verifiques tu email.');
    }

    if (!user.password) {
      throw new ForbiddenException('Esta cuenta usa otro método de inicio de sesión.');
    }

    const isMatch = await this.passwordService.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña es incorrecta.');
    }

    await this.usersService.updateLastLogin(user.id);

    return await this.createAuthenticatedSession({
      deviceId,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
  }

  async signup(dto: SignupDto) {
    dto.email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const invitation = dto.token ? await this.invitationsService.findValidInvitationOrThrow(dto.token) : null;

    if (invitation && invitation.email.toLowerCase() !== dto.email) {
      throw new BadRequestException('El correo electrónico no coincide con el destinatario de la invitación.');
    }

    const hash = await this.passwordService.hash(dto.password);
    const isInvited = Boolean(invitation);
    const emailVerifiedAt = isInvited ? new Date() : null;

    const { token, ...userData } = dto;

    const newUser = await this.prisma.$transaction(async (tx) => {
      await this.lockInvitedAccountCreation(invitation, tx);
      const createdUser = await this.usersService.create(
        {
          ...userData,
          password: hash,
          emailVerifiedAt,
        },
        tx,
      );

      if (invitation && dto.token) {
        await this.invitationsService.acceptWithTx(tx, invitation, createdUser.id);
      }

      return createdUser;
    });

    if (emailVerifiedAt) {
      const session = await this.createAuthenticatedSession({ userId: newUser.id, tokenVersion: newUser.tokenVersion });
      return {
        requiresEmailVerification: false as const,
        session,
        tenantId: invitation!.tenantId,
      };
    }

    await this.verificationsService.requestVerification({
      recipientId: newUser.id,
      recipientType: RecipientType.USER,
      type: VerificationType.USER_EMAIL_VERIFICATION,
    });

    return {
      requiresEmailVerification: true as const,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, avatarUrl: newUser.avatarUrl },
      activeTenant: null,
      hasMultipleTenants: false,
    };
  }

  async getMe(userId: string, tenantId?: string) {
    return await this.usersService.findMeById(userId, tenantId);
  }

  async loginOrCreateFromGoogle(userInfo: GoogleUserInfo, deviceId?: string, invitationToken?: string) {
    const email = userInfo.email.trim().toLowerCase();
    const invitation = await this.verifyGoogleInvitation(userInfo, email, invitationToken);
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockInvitedAccountCreation(invitation, tx);
      const user = await this.saveGoogleAccount(userInfo, email, tx);
      let acceptedInvitation: AcceptedInvitationResponse | null = null;
      if (invitation) {
        acceptedInvitation = await this.invitationsService.acceptWithTx(tx, invitation, user.id, email);
      }
      await this.usersService.updateLastLogin(user.id, tx);
      return { user, acceptedInvitation };
    });

    const session = await this.createAuthenticatedSession({
      deviceId,
      userId: result.user.id,
      tokenVersion: result.user.tokenVersion,
    });
    const redirectPath = await this.googleRedirectPath(result.user.id, result.acceptedInvitation);
    return { ...session, redirectPath };
  }

  private async verifyGoogleInvitation(userInfo: GoogleUserInfo, email: string, token?: string) {
    if (!userInfo.emailVerifiedAt) {
      throw new ForbiddenException('Google no verificó este correo.');
    }
    if (!token) {
      return null;
    }
    const invitation = await this.invitationsService.findValidInvitationOrThrow(token, true);
    if (invitation.email.toLowerCase() !== email) {
      throw new ForbiddenException('Esta invitación no corresponde a tu cuenta de Google.');
    }
    return invitation;
  }

  private async lockInvitedAccountCreation(invitation: Invitation | null, tx: TransactionClient) {
    if (!invitation) {
      return;
    }
    if (invitation.professionalId) {
      await lockProfessionalAccess(tx, invitation.tenantId, invitation.professionalId);
      return;
    }
    await lockTenantAccess(tx, invitation.tenantId);
  }

  private async saveGoogleAccount(userInfo: GoogleUserInfo, email: string, tx: TransactionClient) {
    let user = await tx.user.findUnique({ where: { googleId: userInfo.googleId } });
    if (user && user.email.toLowerCase() !== email) {
      throw new ForbiddenException('El correo de la cuenta no coincide.');
    }
    if (!user) {
      user = await this.usersService.findByEmail(email, tx);
    }
    if (!user) {
      return this.usersService.create({ ...userInfo, email }, tx);
    }
    if (user.googleId && user.googleId !== userInfo.googleId) {
      throw new ConflictException('La cuenta usa otra identidad de Google.');
    }
    return this.usersService.update(user.id, { googleId: userInfo.googleId, emailVerifiedAt: userInfo.emailVerifiedAt }, tx);
  }

  private async googleRedirectPath(userId: string, invitation: AcceptedInvitationResponse | null) {
    const context = await this.getMe(userId, invitation?.tenantId);
    if (invitation) {
      return `/${invitation.tenantSlug}`;
    }
    if (context.activeTenant) {
      return `/${context.activeTenant.slug}`;
    }
    return '/onboarding/welcome';
  }

  async refresh(token: string) {
    const { jti, tokenVersion } = this.jwtService.validateRefreshToken(token);
    const session = await this.sessionsService.findByJti(jti);

    const user = await this.usersService.findById(session.userId);
    if (user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException('Sesión inválida.');
    }

    await this.sessionsService.extend(session.jti);

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      jti: session.jti,
      tokenVersion: user.tokenVersion,
    });
    const refreshToken = this.jwtService.signRefreshToken({
      sub: user.id,
      jti: session.jti,
      tokenVersion: user.tokenVersion,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(jti: string) {
    return await this.sessionsService.revoke(jti);
  }

  async logoutAll(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.sessionsService.revokeAll(userId, tx);
      await this.usersService.incrementTokenVersion(userId, tx);
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmailOrFail(email);
    await this.verificationsService.requestVerification({
      recipientId: user.id,
      recipientType: RecipientType.USER,
      type: VerificationType.PASSWORD_RESET,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const { recipientId } = await this.verificationsService.verifyToken({
      token,
      type: VerificationType.PASSWORD_RESET,
    });

    const hash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await this.usersService.update(recipientId, { password: hash }, tx);
      await this.sessionsService.revokeAll(recipientId, tx);
      await this.usersService.incrementTokenVersion(recipientId, tx);
    });
  }

  private async createAuthenticatedSession({ userId, deviceId, tokenVersion }: GenerateSessionPayload) {
    const session = await this.sessionsService.createOrRefreshSession({
      userId,
      deviceId,
    });

    const payload = {
      tokenVersion,
      sub: userId,
      jti: session.jti,
    };

    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);

    return { accessToken, refreshToken, deviceId: session.deviceId, userId };
  }
}
