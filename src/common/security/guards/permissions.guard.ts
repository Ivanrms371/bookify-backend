import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.tenantContext?.permissions;

    if (!userPermissions) {
      throw new ForbiddenException('No permissions found for the current user in this tenant');
    }

    const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission as any));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to perform this action');
    }

    return true;
  }
}
