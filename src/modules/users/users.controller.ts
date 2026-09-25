import { Controller, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.update(userId, dto);
  }
}
