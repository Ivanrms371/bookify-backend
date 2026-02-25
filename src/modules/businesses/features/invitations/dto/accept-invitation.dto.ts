import { IsString } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  password: string;
}
