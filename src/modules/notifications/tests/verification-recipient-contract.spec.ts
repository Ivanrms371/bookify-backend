import { validate } from 'class-validator';
import { CreateVerificationDto } from 'src/modules/verifications/domain/dto/create-verification.dto';
import { VerifyOtpDto } from 'src/modules/verifications/domain/dto/verify-otp.dto';

it.each([CreateVerificationDto, VerifyOtpDto])('preserves the USER/CUSTOMER verification contract for %s', async (Dto) => {
  for (const recipientType of ['USER', 'CUSTOMER', 'PROFESSIONAL']) {
    const dto = Object.assign(new Dto(), {
      recipientId: 'recipient',
      recipientType,
      type: 'USER_EMAIL_VERIFICATION',
      code: '123456',
    });
    const recipientErrors = (await validate(dto)).filter((error) => error.property === 'recipientType');
    expect(recipientErrors).toHaveLength(recipientType === 'PROFESSIONAL' ? 1 : 0);
  }
});
