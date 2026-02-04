import { IsEmail } from 'class-validator';

export class MagicLinkRequestDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;
}
