import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';
import { AuthenticatedRequest } from '../types/express-request.type';
import { UserService } from 'src/modules/users/services/user.service';
import { BusinessService } from 'src/modules/businesses/services/business.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = req.cookies['access-token'];
    if (!token) {
      throw new UnauthorizedException('No access token found');
    }
    try {
      const payload = await this.jwtService.validateAccessToken(token);
      const user = await this.userService.findById(payload.sub);

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('User token version mismatch');
      }

      req.user = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        tokenVersion: user.tokenVersion,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}
