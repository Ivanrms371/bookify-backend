import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;

  @IsString()
  @IsOptional()
  professionalId?: string;
}
