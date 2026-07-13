import { Injectable } from '@nestjs/common';
import { EmailNotConfirmedError } from 'src/auth/domain/errors/email-not-confirmed.error';
import { InvalidPasswordError } from 'src/auth/domain/errors/invalid-password.error';
import { SocialLoginRequiredError } from 'src/auth/domain/errors/social-login-required.error';
import { UserNotFoundError } from 'src/auth/domain/errors/user-not-found.error';
import { UsersRepository } from 'src/modules/users/users.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LoginUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.emailVerifiedAt) {
      throw new EmailNotConfirmedError();
    }

    if (!user.password) {
      throw new SocialLoginRequiredError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidPasswordError();
    }

    await this.usersRepository.updateLastLogin(user.id);

    // return await
  }
}
