// verification.controller.ts
import { Controller, Get, Post, Body, Query, Res, Ip, Headers, Request } from '@nestjs/common';
import { Response } from 'express';

// Strategies hacen todo el trabajo
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { PhoneVerificationStrategy } from './strategies/phone-verification.strategy';
import { PasswordResetStrategy } from './strategies/password-reset.strategy';

@Controller('verification')
export class VerificationsController {
  constructor(
    private emailVerification: EmailVerificationStrategy,
    private phoneVerification: PhoneVerificationStrategy,
    private passwordReset: PasswordResetStrategy,
  ) {}

  @Get('email/confirm')
  async confirmEmail(
    @Query('token') token: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
  ) {
    return this.emailVerification.confirmEmail(token);
  }

  @Post('email/resend')
  async resendEmail(@Body('email') email: string) {
    return this.emailVerification.resendVerificationEmail(email);
  }

  // @Post('phone/send')
  // async sendPhoneCode(@Request() req, @Body('phone') phone: string) {
  //   return this.phoneVerification.sendVerificationCode(req.user.id, phone, req.user.businessId, req.ip);
  // }

  // @Post('phone/verify')
  // async verifyPhone(@Request() req, @Body('code') code: string) {
  //   return this.phoneVerification.verifyPhone(req.user.id, code);
  // }

  // @Post('phone/resend')
  // async resendPhoneCode(@Request() req) {
  //   return this.phoneVerification.resendVerificationCode(req.user.id);
  // }

  // @Post('password/request')
  // async requestPasswordReset(@Body('email') email: string, @Ip() ip: string) {
  //   return this.passwordReset.requestReset(email, ip);
  // }

  // @Get('password/verify')
  // async verifyResetToken(@Query('token') token: string) {
  //   return this.passwordReset.verifyToken(token);
  // }

  // @Post('password/reset')
  // async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
  //   return this.passwordReset.resetPassword(token, newPassword);
  // }
}
