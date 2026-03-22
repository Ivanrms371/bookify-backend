import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SignupDto } from '../dto/signup.dto';
import { SessionsService } from 'src/auth/sessions/sessions.service';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '../infrastructure/jwt/jwt.service';
import { GoogleUserInfo } from '../types/google-domain';
import { EmailVerificationStrategy } from 'src/modules/verifications/strategies/email-verification.strategy';
import { PasswordService } from './password.service';
import { BusinessesService } from 'src/modules/businesses/businesses.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly emailVerificationStrategy: EmailVerificationStrategy,
  ) {}

  async login(dto: LoginDto, deviceId?: string) {
    const user = await this.usersService.findUserByEmailOrFail(dto.email);

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Debes verificar tu correo electrónico antes de iniciar sesión.');
    }
    if (!user.password) {
      throw new ForbiddenException('Prueba otra forma de iniciar sesión.');
    }

    const isMatch = await this.passwordService.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña es incorrecta.');
    }

    await this.usersService.updateUser(user.id, { lastLoginAt: new Date() });

    return await this.generateNewSession({
      deviceId,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
  }

  async signup(dto: SignupDto) {
    const user = await this.usersService.findUserByEmail(dto.email);
    if (user) {
      throw new ConflictException('Usuario ya registrado.');
    }
    const hash = await this.passwordService.hash(dto.password);
    const newUser = await this.usersService.createUser({
      ...dto,
      password: hash,
    });
    const { id: userId, email } = newUser;

    this.eventEmitter.emit('user.created', {
      userId,
      name: dto.name,
      email,
    });

    return newUser;
  }

  async getMe(userId: string) {
    const user = await this.usersService.findUserById(userId);
    const businesses = await this.prisma.business.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      businesses,
    };
  }

  async loginOrCreateFromGoogle(userInfo: GoogleUserInfo, deviceId?: string) {
    let user = await this.usersService.findUserByGoogleId(userInfo.googleId);
    if (!user) {
      user = await this.usersService.findUserByEmail(userInfo.email);
      if (user) {
        user = await this.usersService.updateUser(user.id, { googleId: userInfo.googleId });
      } else {
        user = await this.usersService.createUser(userInfo);
      }
    }
    await this.usersService.updateUser(user.id, { lastLoginAt: new Date() });

    return await this.generateNewSession({
      deviceId,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
  }

  async refresh(token: string) {
    const { jti, tokenVersion } = this.jwtService.validateRefreshToken(token);
    const session = await this.sessionsService.findCurrentSessionByJti(jti);

    const user = await this.usersService.findUserById(session.userId);
    if (user.tokenVersion !== tokenVersion) {
      console.log('Sesión inválida.a');
      throw new UnauthorizedException('Sesión inválida.');
    }

    await this.sessionsService.extendSession(session.jti);

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
    return await this.sessionsService.revokeSession(jti);
  }

  async logoutAll(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.sessionsService.revokeAllSessions(userId, tx);
      await this.usersService.incrementTokenVersion(userId, tx);
    });
  }

  async confirmEmail(token: string, deviceId?: string) {
    const user = await this.emailVerificationStrategy.confirmEmail(token);
    const {
      accessToken,
      refreshToken,
      deviceId: newDeviceId,
    } = await this.generateNewSession({
      deviceId,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { user, accessToken, refreshToken, newDeviceId };
  }

  private async generateNewSession({ userId, tokenVersion, deviceId }: { userId: string; tokenVersion: number; deviceId?: string }) {
    try {
      const session = await this.sessionsService.upsertSession({
        userId,
        deviceId,
      });
      const accessToken = this.jwtService.signAccessToken({
        sub: userId,
        jti: session.jti,
        tokenVersion,
      });
      const refreshToken = this.jwtService.signRefreshToken({
        sub: userId,
        jti: session.jti,
        tokenVersion,
      });
      return { accessToken, refreshToken, deviceId: session.deviceId, userId };
    } catch (error) {
      throw error;
    }
  }
}
