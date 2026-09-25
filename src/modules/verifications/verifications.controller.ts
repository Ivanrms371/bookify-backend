import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { VerificationsService } from './core/verifications.service';
import { CreateVerificationDto } from './domain/dto/create-verification.dto';
import { VerifyOtpDto } from './domain/dto/verify-otp.dto';
import { VerifyTokenDto } from './domain/dto/verify-token.dto';
import { Public } from 'src/common/security/decorators/public.decorator';
// import { Throttle } from '@nestjs/throttler'; // TODO: add if @nestjs/throttler is configured

@Public()
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post('request')
  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestVerification(@Body() dto: CreateVerificationDto) {
    return this.verificationsService.requestVerification(dto);
  }

  @Post('verify')
  async verifyToken(@Body() dto: VerifyTokenDto) {
    return this.verificationsService.verifyToken(dto);
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyOtpDto) {
    return this.verificationsService.verifyCode(dto);
  }
}
