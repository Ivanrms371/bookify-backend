import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class StaffGuard implements CanActivate {
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
      throw new BadRequestException('No hemos encontrado el negocio.');
    }

    const userId = request.user.userId;

    const staff = await this.prisma.staff.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      select: {
        id: true,
        displayName: true,
        commissionPercent: true,
      }
    });

    if (!staff) {
      throw new ForbiddenException('You don\'t have permission to perform this action');
    }

    request.tenant.staff = {
      id: staff.id,
      name: staff.displayName,
      commissionPercent: staff.commissionPercent,
    };

    return true;
  }
}
