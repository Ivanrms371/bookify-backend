import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login() {}

  @Post('signup')
  async signup() {}

  @Post('google')
  async googleLogin() {}

  @Post('google/callback')
  async googleCallback() {}

  @Post('magic-link')
  async requestMagicLink() {}

  @Post('magic-link/verify')
  async verifyMagicLink() {}

  @Post('refresh')
  async refresh() {}

  @Post('customer/refresh')
  async customerRefresh() {}
}
