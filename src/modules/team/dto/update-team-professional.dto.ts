import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class UpdateTeamProfessionalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  phoneCountryCode?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @IsBoolean()
  @IsOptional()
  giveAccess?: boolean;

  @ValidateIf((o) => o.giveAccess === true)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
