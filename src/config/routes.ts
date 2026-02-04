export const BACKEND_ROUTES = {
  auth: {
    verifyEmail: '/api/auth/verify/email',
    verifyPhone: '/api/auth/verify/phone',
    resetPassword: '/api/auth/reset/password',
  },
} as const;
