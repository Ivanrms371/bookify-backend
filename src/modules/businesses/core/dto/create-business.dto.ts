import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBasicBusinessDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateBusinessDto {
  @IsString()
  @IsUUID()
  ownerId: string;

  @IsObject()
  @IsOptional()
  plan?: PlanFree;
}

export class PlanFree {
  @IsString()
  id: string;

  limits: {
    whatsappLimit: number;
    professionalLimit: number;
    emailLimit: number;
    appointmentLimit: number;
  };
}
