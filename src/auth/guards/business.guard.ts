import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { MembersService } from 'src/modules/businesses/features/members/members.service';

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membersService: MembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<BusinessRole[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const businessId = request.params.businessId || (request.body.businessId as string);

    if (!businessId) {
      throw new BadRequestException('No hemos encontrado el negocio.');
    }

    const userId = request.user.userId;

    const member = await this.membersService.findByUserAndBusiness(userId, businessId);

    request.member = {
      id: member.id,
      userId: member.userId,
      businessId: member.businessId,
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
