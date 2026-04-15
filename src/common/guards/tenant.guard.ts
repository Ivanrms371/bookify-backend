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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<MembershipRole[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) || [];

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const tenantId = request.params.tenantId || (request.body.tenantId as string);

    if (!tenantId) {
      throw new BadRequestException('We couldn\'t find the business.');
    }

    const userId = request.user.userId;

    const tenant = await this.loadTenantContext(tenantId, userId);

    const membership = tenant.members[0];

    if(!membership) {
      throw new ForbiddenException('You don\'t have permission to perform this action');
    }

    request.tenant = request.tenant || {} as any;
    request.tenant.membership = {
      id: membership.id,
      userId: request.user.userId,
      tenantId: tenantId,
      role: membership.role,
    };

    if (!requiredRoles.length) {
      return true;
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('You don\'t have permission to perform this action');

    }
    return true;
  }

  private async loadTenantContext(id: string, userId: string) {
    const ctx = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        
        members: {
          where: {
            userId,
            status: MembershipStatus.ACTIVE,
          },
          select: {
            id: true,
            role: true,
          }
        },
        staffs: {
          where: {
            userId,
            deletedAt: null,
          },
          select: {
            id: true,
            displayName: true,
            commissionPercent: true,
          }
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
                planType: true,
                isActive: true,
                limits: {
                  select: {
                    professionalLimit: true,
                    appointmentLimit: true,
                    emailLimit: true,
                    whatsappLimit: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if(!ctx?.members[0]) {
      throw new ForbiddenException('You don\'t have permission to perform this action.');
    }

    return ctx;
  }
}
