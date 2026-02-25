import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AuthenticatedRequest } from '../types/express-request.type';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    const platformAdmin = await this.prisma.platformAdmin.findUnique({
      where: { userId: user.userId },
    });

    if (!platformAdmin) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }

    return true;
  }
}
