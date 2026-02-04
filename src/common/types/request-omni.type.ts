import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

export type RequestOmni = AuthenticatedRequest & {
  user: {
    userId: string;
    tokenVersion: number;
  };
};
