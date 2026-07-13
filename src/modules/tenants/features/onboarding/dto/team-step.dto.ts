import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

class TeamInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;

  @IsOptional()
  @IsNumber()
  commission?: number | null;
}

export class TeamStepDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamInvitationDto)
  invitations: TeamInvitationDto[];
}
