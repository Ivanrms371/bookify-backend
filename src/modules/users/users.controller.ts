import { Controller, Put, Body, Get } from '@nestjs/common';
import { CurrentTenant } from 'src/common/security/decorators/current-tenant.decorator';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  @Get('me/profile')
  async getProfile(@CurrentUser('id') userId: string, @CurrentTenant('tenantId') tenantId: string) {
    return this.usersService.getProfile(userId, tenantId);
  }

  constructor(private readonly usersService: UsersService) {}

  @Put('me')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.update(userId, dto);
  }
}
