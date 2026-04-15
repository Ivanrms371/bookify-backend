import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { MembershipsService } from 'src/modules/tenants/features/memberships/memberships.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipsService: MembershipsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const tenantId = request.params.tenantId || (request.body.tenantId as string);

    if (!tenantId) {
      throw new BadRequestException('No hemos encontrado el negocio.');
    }

    const userId = request.user.userId;

    const member = await this.membershipsService.findByUserAndTenant(userId, tenantId);

    request.tenant = request.tenant || {} as any;
    request.tenant.membership = {
      id: member.id,
      userId: member.userId,
      tenantId: member.tenantId,
      role: member.role,
    };

    if (!requiredRoles.length) {
      return true;
    }

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return true;
  }
}
