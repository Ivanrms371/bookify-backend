import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/express-request.type';
import { StaffService } from 'src/modules/staffs/staff.service';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/business-roles.decorator';
import { StaffRole } from 'src/generated/prisma/enums';

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly staffService: StaffService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const businessId = request.params.businessId || (request.body.businessId as string);

    if (!businessId) {
      throw new BadRequestException('We didnt find the business');
    }

    const userId = request.user.userId;

    const staff = await this.staffService.findByUserIdAndBusinessId(userId, businessId);
    if (!staff) {
      throw new NotFoundException('No hemos encontrado tu perfil en este negocio');
    }
    request.staff = {
      staffId: staff.id,
      businessId: staff.businessId,
      role: staff.role,
    };
    if (!requiredRoles.length) {
      return true;
    }

    if (!requiredRoles.includes(staff.role)) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return true;
  }
}
