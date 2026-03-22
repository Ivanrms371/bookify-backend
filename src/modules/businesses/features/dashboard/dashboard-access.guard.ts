import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@Injectable()
export class DashboardAccessGuard implements CanActivate {
  constructor(private readonly membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user.userId;
    const businessId = request.params.businessId;
    const member = await this.membersService.findByUserAndBusiness(userId, businessId);
    if (!member) {
      throw new UnauthorizedException('No tienes permisos para acceder a este recurso.');
    }
    request.member = member;
    return true;
  }
}
