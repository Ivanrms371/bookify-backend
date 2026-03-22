import { Injectable } from '@nestjs/common';
import { GoogleService } from '../infrastructure/google/google.service';
import { AuthService } from './auth.service';
import { ClientInfo } from 'src/common/types/client.type';

@Injectable()
export class AuthCallbackHandler {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  async handleGoogleOAuthCallback(code: string, deviceId?: string) {
    const { access_token } = await this.googleService.exchange(code);
    const userInfo = await this.googleService.getUserInfo(access_token);
    return this.authService.loginOrCreateFromGoogle(userInfo, deviceId);
  }
}
