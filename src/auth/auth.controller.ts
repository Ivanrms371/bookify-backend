import { Request, Response } from 'express';
import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/security/decorators/public.decorator';
import { AuthService } from './services/auth.service';
import { GoogleService } from './infrastructure/google/google.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthCallbackHandler } from './services/auth-callback.handler';
import { AuthenticatedUser, TenantContext } from 'src/common/security/types/authenticated-request.type';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { CurrentTenant } from 'src/common/security/decorators/current-tenant.decorator';
import { OptionalTenant } from 'src/common/security/decorators/optional-tenant.decorator';

@Controller('auth')
export class AuthController {
  private readonly appUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly googleService: GoogleService,
    private readonly authCallbackHandler: AuthCallbackHandler,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:5173';
  }

  @Get('me')
  @OptionalTenant()
  me(@CurrentUser() user: AuthenticatedUser, @CurrentTenant() tenant: TenantContext) {
    return this.authService.getMe(user.id, tenant?.tenantSlug ?? undefined);
  }

  @Public()
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response, @Body() dto: LoginDto) {
    const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID);
    const { accessToken, refreshToken, deviceId: newDeviceId, userId } = await this.authService.login(dto, deviceId);
    this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, newDeviceId);

    const data = await this.authService.getMe(userId);
    res.send(data);
  }

  @Public()
  @Post('signup')
  async signup(@Res({ passthrough: true }) res: Response, @Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    if (result.requiresEmailVerification) {
      return result;
    }
    const { userId, accessToken, deviceId, refreshToken } = result.session;
    this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, deviceId);

    const meData = await this.authService.getMe(userId);

    return {
      requireEmailVerification: false,
      ...meData,
    };
  }

  @Public()
  @Get('google')
  google(@Req() req: Request, @Res() res: Response, @Query('invitationToken') invitationToken?: string) {
    const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID);
    const url = this.googleService.getAuthorizationUrl({ deviceId, invitationToken });
    res.send({ url });
  }

  @Public()
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: { code: string; state: string; invitationToken: string },
  ) {
    try {
      const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID) || query.state;
      const {
        accessToken,
        refreshToken,
        deviceId: newDeviceId,
      } = await this.authCallbackHandler.handleGoogleOAuthCallback({ code: query.code, deviceId, invitationToken: query.invitationToken });
      this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
      this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
      this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, newDeviceId);
      res.redirect(`${this.appUrl}/onboarding`);
    } catch (error) {
      res.redirect(`${this.appUrl}/login`);
    }
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = this.cookieService.getOrFail(req, COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesión para continuar');
    }
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken);
    this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, newRefreshToken);
    res.json({ success: true });
  }

  @Post('logout')
  async logout(@Req() user: AuthenticatedUser, @Res() res: Response) {
    if (!user.id) res.json({ success: false });
    await this.authService.logout(user.id);
    this.cookieService.clear(res, COOKIE_KEYS.ACCESS_TOKEN);
    this.cookieService.clear(res, COOKIE_KEYS.REFRESH_TOKEN);
    res.json({ success: true });
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const userId = user.id;
    await this.authService.logoutAll(userId);
    this.cookieService.clear(res, COOKIE_KEYS.ACCESS_TOKEN);
    this.cookieService.clear(res, COOKIE_KEYS.REFRESH_TOKEN);
    res.json({ success: true });
  }

  @Public()
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true };
  }

  @Public()
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true };
  }
}
