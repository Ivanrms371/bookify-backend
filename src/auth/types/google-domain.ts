export type GoogleTokens = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type GoogleUserInfo = {
  googleId: string;
  name: string;
  email: string;
  emailVerifiedAt?: Date;
  avatarUrl?: string;
};
