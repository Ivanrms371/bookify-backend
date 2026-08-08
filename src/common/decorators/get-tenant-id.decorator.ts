import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

export const GetTenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const tenantId = request.tenantContext?.tenantId;

  if (!tenantId) {
    throw new BadRequestException('El ID del tenant es requerido para realizar esta acción');
  }

  return tenantId;
});
