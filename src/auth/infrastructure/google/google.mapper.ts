import { GoogleTokens, GoogleUserInfo } from 'src/auth/types/google-domain';

export class GoogleMapper {
  static tokensToDomain(response: any): GoogleTokens {
    return {
      access_token: response.access_token,
      id_token: response.id_token,
      refresh_token: response.refresh_token,
      expires_in: response.expires_in,
      scope: response.scope,
      token_type: response.token_type,
    };
  }

  static userInfoToDomain(response: any): GoogleUserInfo {
    return {
      googleId: response.id,
      email: response.email,
      emailVerifiedAt: response.verified_email && new Date(),
      name: response.name,
      avatarUrl: response.picture,
    };
  }
}
