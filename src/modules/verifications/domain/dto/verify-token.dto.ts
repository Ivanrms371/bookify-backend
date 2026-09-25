import { IsEnum, IsString, MinLength } from 'class-validator';
import { VerificationType } from 'src/generated/prisma/enums';

export class VerifyTokenDto {
  @IsEnum(VerificationType)
  type: VerificationType;

  @IsString()
  @MinLength(1)
  token: string;
}
