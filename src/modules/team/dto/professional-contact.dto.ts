import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Matches, ValidateIf } from 'class-validator';

export class ProfessionalContactDto {
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  avatarPublicId?: string | null;

  @IsOptional()
  @IsString()
  colorTheme?: string | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/[\s()-]/g, '') : value))
  @IsString()
  @Matches(/^\d{4,15}$/, { message: 'Ingresá un teléfono válido.' })
  phoneNumber?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/^\+/, '') : value))
  @IsString()
  @Matches(/^[1-9]\d{0,3}$/, { message: 'Ingresá un código de país válido.' })
  phoneCountryCode?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayUnique({ message: 'No se pueden repetir servicios.' })
  @IsUUID('all', { each: true })
  serviceIds?: string[];
}
