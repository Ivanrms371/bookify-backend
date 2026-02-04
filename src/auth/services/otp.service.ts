import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthContext } from '../types/auth-context.type';
import { OtpRepository } from '../repositories/otp.repository';

@Injectable()
export class OtpService {
  constructor(private readonly otpRepository: OtpRepository) {}

  /**
   * Send OTP to phone number
   * TODO: Implement with SMS provider (Twilio/SNS)
   */
  async sendOtp(phone: string, ctx: AuthContext) {
    throw new NotImplementedException('OTP authentication is not yet implemented');
  }

  /**
   * Validate OTP code
   */
  async validateOtp(phone: string, code: string, ctx: AuthContext) {
    throw new NotImplementedException('OTP authentication is not yet implemented');
  }
}
