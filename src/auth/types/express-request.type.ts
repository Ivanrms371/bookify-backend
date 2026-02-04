import { Request } from 'express';
import { AuthenticatedRequestStaff, AuthenticatedRequestUser } from './request-user.type';

export type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
  staff: AuthenticatedRequestStaff;
};
