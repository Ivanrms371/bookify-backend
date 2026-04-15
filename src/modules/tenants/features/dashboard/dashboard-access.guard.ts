import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class DashboardAccessGuard implements CanActivate {
  constructor(private readonly membershipsService: MembershipsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user.userId;
    const tenantId = request.params.tenantId;
    const member = await this.membershipsService.findByUserAndTenant(userId, tenantId);
    if (!member) {
      throw new UnauthorizedException('No tienes permisos para acceder a este recurso.');
    }
    request.tenant = request.tenant || {} as any;
    request.tenant.membership = {
      id: member.id,
      userId: member.userId,
      tenantId: member.tenantId,
      role: member.role,
    };
    return true;
  }
}
