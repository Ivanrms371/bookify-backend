// tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { MembershipStatus } from 'src/generated/prisma/enums';
import { REQUIRE_PERMISSIONS_KEY } from 'src/auth/constants/auth.constants';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = req.user?.id;

    const rawTenantId = req.headers['x-tenant-id'];
    const rawTenantSlug = req.headers['x-tenant-slug'];
    const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : (rawTenantId as string | null);
    const tenantSlug = Array.isArray(rawTenantSlug) ? rawTenantSlug[0] : (rawTenantSlug as string | null);

    console.log(userId, tenantId);

    if (!userId || !tenantId) throw new UnauthorizedException();

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      select: {
        role: true,
        status: true,
      },
    });
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('Acceso denegado al espacio de trabajo');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const userPermissions = await this.permissionService.getPermissionsForRole(membership.role, tenantId);

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllRequiredPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission));

      if (!hasAllRequiredPermissions) {
        throw new ForbiddenException('No tienes permisos suficientes');
      }
    }

    req.tenantContext = {
      tenantId,
      tenantSlug,
      role: membership.role,
      permissions: userPermissions,
    };

    return true;
  }
}
