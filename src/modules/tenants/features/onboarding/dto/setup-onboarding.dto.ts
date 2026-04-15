import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetupOnboardingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
