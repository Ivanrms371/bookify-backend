import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { stringify } from 'querystring';
import { GoogleMapper } from './google.mapper';

@Injectable()
export class GoogleService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  constructor(config: ConfigService) {
    this.clientId = config.getOrThrow('GOOGLE_CLIENT_ID');
    this.clientSecret = config.getOrThrow('GOOGLE_CLIENT_SECRET');
    this.redirectUri = config.getOrThrow('GOOGLE_REDIRECT_URI');
  }
  getAuthorizationUrl(deviceId?: string) {
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(deviceId && { state: deviceId }),
    };

    return `https://accounts.google.com/o/oauth2/v2/auth?${stringify(params)}`;
  }

  async exchange(code: string) {
    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      });
      console.log(data);
      return GoogleMapper.tokensToDomain(data);
    } catch (error) {
      console.log(error);
      throw new Error('Error al intercambiar el código de autorización');
    }
  }

  async getUserInfo(accessToken: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return GoogleMapper.userInfoToDomain(data);
  }
}
