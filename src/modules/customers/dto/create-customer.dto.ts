import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El prefijo del teléfono es requerido' })
  phoneCountryCode: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phoneNumber: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
