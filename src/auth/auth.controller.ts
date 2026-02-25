import { Request, Response } from 'express';
import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './application/auth.service';
import { GoogleService } from './infrastructure/google/google.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthCallbackHandler } from './application/auth-callback.handler';
import { AuthCookieService } from './infrastructure/cookies/auth-cookie.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { ClientInfo } from 'src/common/types/client.type';
import { PasswordService } from './application/password.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly authCookieService: AuthCookieService,
    private readonly googleService: GoogleService,
    private readonly authCallbackHandler: AuthCallbackHandler,
  ) {}

  private normalizeClientInfo(req: Request): ClientInfo {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : (req.ip ?? '');

    return {
      ipAddress: ip.trim().toLowerCase(),
      userAgent: req.get('user-agent')?.trim().toLowerCase() ?? '',
    };
  }

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response, @Body() dto: LoginDto) {
    const deviceId = this.authCookieService.getDeviceIdCookie(req);
    const { accessToken, refreshToken, deviceId: newDeviceId } = await this.authService.login(dto, this.normalizeClientInfo(req), deviceId);
    this.authCookieService.setDeviceIdCookie(res, newDeviceId);
    this.authCookieService.setAccessTokenCookie(res, accessToken);
    this.authCookieService.setRefreshTokenCookie(res, refreshToken);
    res.json({ accessToken, refreshToken });
  }

  @Post('signup')
  signup(@Req() req: Request, @Body() dto: SignupDto) {
    return this.authService.signup(dto, this.normalizeClientInfo(req));
  }

  @Get('google')
  google(@Req() req: Request, @Res() res: Response) {
    const deviceId = this.authCookieService.getDeviceIdCookie(req);
    const url = this.googleService.getAuthorizationUrl(deviceId);
    res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response, @Query() query: { code: string; state: string }) {
    const deviceId = this.authCookieService.getDeviceIdCookie(req) || query.state;
    const {
      accessToken,
      refreshToken,
      deviceId: newDeviceId,
    } = await this.authCallbackHandler.handleGoogleOAuthCallback(query.code, this.normalizeClientInfo(req), deviceId);
    this.authCookieService.setDeviceIdCookie(res, newDeviceId);
    this.authCookieService.setAccessTokenCookie(res, accessToken);
    this.authCookieService.setRefreshTokenCookie(res, refreshToken);
    res.json({ accessToken, refreshToken });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = this.authCookieService.getRefreshTokenCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesión para continuar');
    }
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken);
    this.authCookieService.setAccessTokenCookie(res, accessToken);
    this.authCookieService.setRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken, newRefreshToken });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const jti = req.user.jti;
    await this.authService.logout(jti);
    this.authCookieService.clearAccessTokenCookie(res);
    this.authCookieService.clearRefreshTokenCookie(res);
    res.json({ success: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user.userId;
    await this.authService.logoutAll(userId);
    this.authCookieService.clearAccessTokenCookie(res);
    this.authCookieService.clearRefreshTokenCookie(res);
    res.json({ success: true });
  }

  @Get('email/confirm')
  async confirmEmail(@Req() req: Request, @Query() query: { token: string }) {
    return this.authService.confirmEmailAndMaybeLogin(query.token, this.normalizeClientInfo(req));
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
