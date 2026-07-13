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
import { GenerateSessionPayload } from '../types/auth-session.type';

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

     if (!user.emailVerifiedAt) 
      throw new ForbiddenException('Debés verificar tu correo antes de iniciar sesión.')
  
    if (!user.password) 
      throw new ForbiddenException('Esta cuenta usa otro método de inicio de sesión.')

    const isMatch = await this.passwordService.compare(dto.password, user.password);
     if (!isMatch) throw new UnauthorizedException('La contraseña es incorrecta.')

    await this.usersService.updateLastLogin(user.id);

    return await this.generateNewSession({
      deviceId,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

  }

  async signup(dto: SignupDto) {
    const user = await this.usersService.findUserByEmail(dto.email);
    if (user) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }
    const hash = await this.passwordService.hash(dto.password);
    const newUser = await this.usersService.createUser({
      ...dto,
      password: hash,
    });
    const { id, email, name } = newUser;

    this.eventEmitter.emit('user.created', {
      userId: id,
      name,
      email,
    });


    return {
      name,
      email,
      success: true,
    }
  }

  async getMe(userId: string) {
    return this.usersService.findMeById(userId);
  }

  async loginOrCreateFromGoogle(userInfo: GoogleUserInfo, deviceId?: string) {
    let user = await this.usersService.findUserByGoogleId(userInfo.googleId);
    if (!user) {
      user = await this.usersService.findUserByEmail(userInfo.email);
      if (user) {
        user = await this.usersService.update(user.id, { googleId: userInfo.googleId });
      } else {
        user = await this.usersService.createUser(userInfo);
      }
    }
    await this.usersService.updateLastLogin(user.id);

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

  private async generateNewSession({ userId, deviceId, tokenVersion }: GenerateSessionPayload) {
      const session = await this.sessionsService.upsertSession({
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
