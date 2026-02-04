import { AuthContext } from 'src/auth/types/auth-context.type';

export class CreateEmailVerificationDto {
  userId: string;
  name: string;
  email: string;
  ctx: AuthContext;
}
