import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InitOnboardingDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;
}
