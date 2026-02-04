import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/express-request.type';
import { StaffRole } from 'src/generated/prisma/enums';

@Injectable()
export class StaffAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requester = req.staff;

    const targetStaffId = req.params.staffId;

    const isSelf = requester.staffId === targetStaffId;
    const isAdmin = requester.role === StaffRole.OWNER || requester.role === StaffRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }

    return true;
  }
}
