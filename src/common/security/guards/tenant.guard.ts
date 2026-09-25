import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PrismaService } from 'src/shared/prisma/prisma.service';

import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_TENANT_KEY } from '../decorators/optional-tenant.decorator';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';
import { isUUID } from 'class-validator';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.constants';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const isSkipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [context.getHandler(), context.getClass()]);
    if (isSkipTenant) {
      return true;
    }

    const isOptionalTenant = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_TENANT_KEY, [context.getHandler(), context.getClass()]);

    const rawTenantId = req.headers['x-tenant-id'];
    const rawTenantSlug = req.headers['x-tenant-slug'];

    const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : (rawTenantId ?? null);

    const tenantSlug = Array.isArray(rawTenantSlug) ? rawTenantSlug[0] : (rawTenantSlug ?? null);

    // No tenant was provided.
    if (!tenantId && !tenantSlug) {
      if (!isOptionalTenant) {
        throw new BadRequestException('Tenant identifier is required');
      }

      const membership = await this.prisma.membership.findFirst({
        where: {
          userId,
          isActive: true,
        },
        select: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
          role: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You do not have access to any tenant');
      }

      req.tenantContext = {
        tenantId: membership.tenant.id,
        tenantSlug: membership.tenant.slug,
        role: membership.role,
        permissions: (ROLE_PERMISSIONS[membership.role] as unknown as string[]) || [],
      };

      return true;
    }

    // Tenant ID takes precedence over tenant slug.
    let resolvedTenantId: string;

    if (tenantId) {
      if (!isUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID');
      }

      resolvedTenantId = tenantId;
    } else {
      const tenant = await this.prisma.tenant.findUnique({
        where: {
          slug: tenantSlug!,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      resolvedTenantId = tenant.id;
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: resolvedTenantId,
        },
      },
      select: {
        role: true,
        isActive: true,
        tenant: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    req.tenantContext = {
      tenantId: resolvedTenantId,
      tenantSlug: membership.tenant.slug,
      role: membership.role,
      permissions: (ROLE_PERMISSIONS[membership.role] as unknown as string[]) || [],
    };

    return true;
  }
}
