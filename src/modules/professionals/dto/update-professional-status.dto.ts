import { IsBoolean } from 'class-validator';

export class UpdateProfessionalStatusDto {
  @IsBoolean()
  isActive: boolean;
}
