import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class CreateInviteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @IsIn([MembershipRole.ADMIN, MembershipRole.STAFF])
  role: MembershipRole;

  @IsUUID()
  @IsOptional()
  professionalId?: string;
}
