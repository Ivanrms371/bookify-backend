import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipRole, CommissionType } from 'src/generated/prisma/enums';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @IsEnum(CommissionType)
  @IsOptional()
  commissionType?: CommissionType;

  @IsEnum(CommissionType)
  @IsOptional()
  comisionType?: CommissionType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  commissionValue?: number;
}
