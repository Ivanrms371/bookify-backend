import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest, TenantContext } from 'src/common/security/types/authenticated-request.type';

export const GetTenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const tenantId = request.tenantContext?.tenantId;

  if (!tenantId) {
    throw new BadRequestException('El ID del tenant es requerido para realizar esta acción');
  }

  return tenantId;
});

export const CurrentTenant = createParamDecorator((data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const tenantContext = request.tenantContext;

  return data ? tenantContext?.[data] : tenantContext;
});
