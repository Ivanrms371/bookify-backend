// src/modules/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';

export const CurrentUser = createParamDecorator((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  const user = request.user;

  if (!user) {
    throw new InternalServerErrorException(
      'CurrentUser decorator invoked without an authenticated user in the request pipeline. Ensure JwtAuthGuard is applied.',
    );
  }

  return data ? user[data] : user;
});
