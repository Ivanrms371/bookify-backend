import { BACKEND_ROUTES } from 'src/config/routes';

export const VerificationUrls = {
  email(token: string) {
    return `${process.env.BACKEND_URL}${BACKEND_ROUTES.auth.verifyEmail}/${token}`;
  },
};
