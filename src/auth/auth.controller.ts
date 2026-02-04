import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { createAuthContext } from './utils/auth-context.util';
import { MagicLinkService } from './services/magic-link.service';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async register(@Body() data: SignupDto, @Req() req: Request) {
    const ctx = createAuthContext(req);
    await this.authService.signup(data, ctx);

    return {
      success: true,
      message: 'Cuenta creada. Hemos enviado un email para confirmar su cuenta.',
    };
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() data: LoginUserDto,
  ) {
    const ctx = createAuthContext(req);
    const { accessToken, refreshToken, user } = await this.authService.login(data, ctx);

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/api/auth/refresh',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.cookie('access-token', accessToken, {
      httpOnly: true,
      secure: false,
      path: '/api',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15,
    });

    return user;
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh-token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesion para continuar');
    }

    console.log(refreshToken);
    const { accessToken } = await this.authService.refreshToken(refreshToken);
    console.log('refreshed', accessToken);

    res.cookie('access-token', accessToken, {
      httpOnly: true,
      secure: false,
      path: '/api',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15,
    });

    return { success: true };
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const accessToken = req.cookies['access-token'];
    if (!accessToken) {
      throw new UnauthorizedException('Inicia sesion para continuar');
    }

    return await this.authService.getMe(accessToken);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh-token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesion para continuar');
    }
    res.clearCookie('refresh-token');
    return this.authService.revokeRefreshToken(refreshToken);
  }

  @Post('logout-all')
  async revokeAllTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh-token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Inicia sesion para continuar');
    }
    res.clearCookie('refresh-token');
    return this.authService.revokeAllTokens(refreshToken);
  }

  @Post('magic-link/request')
  async requestMagicLink(@Body() data: MagicLinkRequestDto, @Req() req: Request) {
    const ctx = createAuthContext(req);
    return this.authService.requestMagicLink(data.email, ctx);
  }

  @Get('magic-link/verify/:token')
  async verifyMagicLink(
    @Param('token') token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ctx = createAuthContext(req);
    const { accessToken, refreshToken, user } = await this.authService.loginWithMagicLink(
      token,
      ctx,
    );

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/api/auth/refresh',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 180, // 6 months for customers
    });

    res.cookie('access-token', accessToken, {
      httpOnly: true,
      secure: false,
      path: '/api',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days for customers
    });

    return user;
  }
}
