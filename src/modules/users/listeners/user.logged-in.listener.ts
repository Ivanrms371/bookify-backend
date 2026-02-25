import { OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '../users.service';

export class UserLoggedInListener {
  constructor(private readonly usersService: UsersService) {}

  @OnEvent('user.logged-in', { async: true })
  async handle(payload: { userId: string }) {
    await this.usersService.updateLastLogin(payload.userId);
  }
}
