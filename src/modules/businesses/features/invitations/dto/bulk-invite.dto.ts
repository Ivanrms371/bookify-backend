import { IsEmail, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessRole } from 'src/generated/prisma/enums';

export class InviteItemDto {
  @IsEmail()
  email: string;

  @IsEnum(BusinessRole)
  role: BusinessRole;
}

export class BulkInviteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteItemDto)
  items: InviteItemDto[];
}
