import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/modules/users/users.service';
import { PasswordResetStrategy } from 'src/modules/verifications/strategies/password-reset.strategy';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';

@Injectable()
export class PasswordService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordResetStrategy: PasswordResetStrategy,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmailOrFail(dto.email);

    return await this.passwordResetStrategy.requestReset({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verification = await this.passwordResetStrategy.verifyResetToken(dto.token);

    const password = await this.hash(dto.password);

    await this.usersService.update(verification.userId, { password });

    return { message: 'Contraseña restablecida correctamente' };
  }

  async hash(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}
