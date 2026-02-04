import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from './services/jwt.service';
import { AuthContext } from './types/auth-context.type';
import { RefreshTokenService } from './services/refresh-token.service';
import { UserService } from 'src/modules/users/services/user.service';
import { SignupDto } from './dto/signup-user.dto';
import { BusinessService } from 'src/modules/businesses/services/business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailVerificationStrategy } from 'src/modules/verifications/strategies/email-verification.strategy';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { MagicLinkService } from './services/magic-link.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly emailVerificationStrategy: EmailVerificationStrategy,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  async login(data: LoginUserDto, ctx: AuthContext) {
    const user = await this.userService.findByEmailOrFail(data.email);

    if (!user?.password) {
      throw new UnauthorizedException('Prueba iniciar sesion con tu cuenta de Google');
    }

    const isPasswordValid = await this.passwordService.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Verifica tu cuenta para continuar');
    }

    const session = await this.sessionService.generateUserSession(user, ctx);
    return session;
  }

  async signup(data: SignupDto, ctx: AuthContext) {
    const user = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await this.passwordService.hash(data.password);
      const user = await this.userService.create(
        {
          ...data,
          password: passwordHash,
        },
        tx,
      );
      await this.businessService.createBusiness(
        { userId: user.id, name: data.name, phone: data.phone },
        tx,
      );

      return user;
    });

    this.emailVerificationStrategy.sendVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
      ip: ctx.ip,
    });

    return {
      success: true,
      message: 'Tu cuenta ha sido creada correctamente, hemos enviado un email para confirmarla.',
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = await this.jwtService.validateRefreshToken(refreshToken);
    const user = await this.refreshTokenService.refresh(refreshToken, decoded);
    const business = await this.businessService.findByOwnerId(user.id);
    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { accessToken };
  }

  async getMe(accessToken: string) {
    const decoded = await this.jwtService.validateAccessToken(accessToken);
    const user = await this.userService.findById(decoded.sub);
    return this.sessionService.getUserContext(user);
  }

  async revokeRefreshToken(refreshToken: string) {
    const decoded = await this.jwtService.validateRefreshToken(refreshToken);
    return this.refreshTokenService.revoke(refreshToken, decoded);
  }

  async revokeAllTokens(refreshToken: string) {
    const decoded = await this.jwtService.validateRefreshToken(refreshToken);
    return this.refreshTokenService.revokeAllTokens(refreshToken, decoded);
  }

  async requestMagicLink(email: string, ctx: AuthContext) {
    return this.magicLinkService.generateMagicLink(email, ctx);
  }

  async loginWithMagicLink(token: string, ctx: AuthContext) {
    return this.magicLinkService.validateMagicLink(token, ctx);
  }

  async loginWithGoogle(googleUser: any, ctx: AuthContext) {
    // 1. Find user by googleId or email
    // 2. If not found, create new user (Customer or just User)
    // 3. Generate session (My JWT)

    // Placeholder implementation
    /*
    let user = await this.userService.findByGoogleId(googleUser.googleId);
    if (!user) {
      user = await this.userService.createFromGoogle(googleUser);
    }
    return this.sessionService.generateUserSession(user, ctx);
    */
    throw new Error('Method not implemented.');
  }
}
