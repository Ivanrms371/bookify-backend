import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCustomerNotesDto {
  @IsString()
  @IsNotEmpty({ message: 'La nota no puede estar vacía' })
  notes: string;
}
