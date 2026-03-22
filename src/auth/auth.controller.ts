import { Request, Response } from 'express';
import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './application/auth.service';
import { GoogleService } from './infrastructure/google/google.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthCallbackHandler } from './application/auth-callback.handler';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { PasswordService } from './application/password.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { CookieService } from 'src/shared/cookies/cookie.service';
import { COOKIE_KEYS } from 'src/shared/cookies/cookie.key';

@Public()
@Controller('auth')
export class AuthController {
  private readonly appUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly passwordService: PasswordService,
    private readonly googleService: GoogleService,
    private readonly authCallbackHandler: AuthCallbackHandler,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:5173';
  }

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response, @Body() dto: LoginDto) {
    const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID);
    const { accessToken, refreshToken, deviceId: newDeviceId } = await this.authService.login(dto, deviceId);
    this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, newDeviceId);
    res.send({
      success: true,
    });
  }

  @Post('signup')
  async signup(@Req() req: Request, @Body() dto: SignupDto) {
    try {
      await this.authService.signup(dto);
      return {
        success: true,
        message: 'Usuario registrado exitosamente',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('google')
  google(@Req() req: Request, @Res() res: Response) {
    const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID);
    const url = this.googleService.getAuthorizationUrl(deviceId);
    res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response, @Query() query: { code: string; state: string }) {
    try {
      const deviceId = this.cookieService.get(req, COOKIE_KEYS.DEVICE_ID) || query.state;
      const {
        accessToken,
        refreshToken,
        deviceId: newDeviceId,
      } = await this.authCallbackHandler.handleGoogleOAuthCallback(query.code, deviceId);
      this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
      this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
      this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, newDeviceId);
      res.redirect(`${this.appUrl}/onboarding`);
    } catch (error) {
      res.redirect(`${this.appUrl}/login`);
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    console.log('Refresh');
    const refreshToken = this.cookieService.getOrFail(req, COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesión para continuar');
    }
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken);
    this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    res.json({ success: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const jti = req.user.jti;
    await this.authService.logout(jti);
    this.cookieService.clear(res, COOKIE_KEYS.ACCESS_TOKEN);
    this.cookieService.clear(res, COOKIE_KEYS.REFRESH_TOKEN);
    res.json({ success: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user.userId;
    await this.authService.logoutAll(userId);
    this.cookieService.clear(res, COOKIE_KEYS.ACCESS_TOKEN);
    this.cookieService.clear(res, COOKIE_KEYS.REFRESH_TOKEN);
    res.json({ success: true });
  }

  @Get('email/confirm')
  async confirmEmail(@Res() res: Response, @Query() query: { token: string }) {
    try {
      const { accessToken, newDeviceId, refreshToken } = await this.authService.confirmEmail(query.token);
      this.cookieService.set(res, COOKIE_KEYS.ACCESS_TOKEN, accessToken);
      this.cookieService.set(res, COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
      this.cookieService.set(res, COOKIE_KEYS.DEVICE_ID, newDeviceId);
      res.redirect(`${this.appUrl}/onboarding`);
    } catch (error) {
      res.redirect(`${this.appUrl}/verify-error?reason=${error.response.error}`);
    }
  }

  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }
}
