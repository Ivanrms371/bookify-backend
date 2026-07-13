import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/tenant-roles.decorator';
import { MembershipRole, MembershipStatus } from 'src/generated/prisma/enums';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  private tenantContextCache = new Map<string, { data: any; expires: number }>();
  private readonly TTL = 10000;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<MembershipRole[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) || [];

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const tenantId = (request.headers['x-tenant-id'] as string) || request.params?.tenantId || request.body?.tenantId;

    if (!tenantId) {
      throw new BadRequestException("We couldn't find the business.");
    }

    const userId = request.user.userId;

    const tenant = await this.loadTenantContext(tenantId, userId);

    const membership = tenant.memberships.find((m) => m.userId === userId);

    if (!membership) {
      throw new ForbiddenException("You don't have permission to perform this action");
    }

    request.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      membership: {
        id: membership.id,
        userId: request.user.userId,
        tenantId: tenantId,
        role: membership.role,
      },
    } as any;

    if (!requiredRoles.length) {
      return true;
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException("You don't have permission to perform this action");
    }
    return true;
  }

  private async loadTenantContext(id: string, userId: string) {
    const cacheKey = `tenant-${id}`;
    const now = Date.now();
    const cached = this.tenantContextCache.get(cacheKey);

    let tenant;
    if (cached && now < cached.expires) {
      tenant = cached.data;
    } else {
      tenant = await this.prisma.tenant.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,

          memberships: {
            where: {
              status: MembershipStatus.ACTIVE,
            },
            select: {
              id: true,
              userId: true,
              role: true,
            },
          },
          employees: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              displayName: true,
              commissionPercent: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              currentPeriodEnd: true,
              trialEndsAt: true,
              plan: {
                select: {
                  id: true,
                  whatsappLimit: true,
                  appointmentLimit: true,
                  emailLimit: true,
                },
              },
            },
          },
        },
      });

      if (tenant) {
        this.tenantContextCache.set(cacheKey, { data: tenant, expires: now + this.TTL });
      }
    }

    const userMembership = tenant?.memberships.find((m) => m.userId === userId);

    if (!userMembership) {
      throw new ForbiddenException('No tienes acceso a este negocio.');
    }

    return tenant;
  }
}
