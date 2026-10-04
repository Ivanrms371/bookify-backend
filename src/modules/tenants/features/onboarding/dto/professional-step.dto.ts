import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';

export class ProfessionalStepDto {
  @IsBoolean()
  attendsClients: boolean;

  @ValidateIf((dto: ProfessionalStepDto) => dto.attendsClients === true)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((dto: ProfessionalStepDto) => dto.attendsClients === true)
  @IsEmail()
  email?: string;

  @ValidateIf((dto: ProfessionalStepDto) => dto.attendsClients === true)
  @IsString()
  @Matches(/^\+?\d{1,4}$/)
  phoneCountryCode?: string;

  @ValidateIf((dto: ProfessionalStepDto) => dto.attendsClients === true)
  @IsString()
  @Matches(/^[\d ()-]{4,20}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @ValidateIf((dto: ProfessionalStepDto) => dto.attendsClients === true)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  serviceIds?: string[];
}
