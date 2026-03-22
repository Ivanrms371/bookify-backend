import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.usersService.getMe(userId);
  }
}
