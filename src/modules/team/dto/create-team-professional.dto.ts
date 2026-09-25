import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class CreateTeamProfessionalDto {
  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  phoneCountryCode: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @IsBoolean()
  giveAccess: boolean;

  @ValidateIf((o) => o.giveAccess === true)
  @IsEnum(MembershipRole)
  @IsOptional()
  role?: MembershipRole;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;
}
