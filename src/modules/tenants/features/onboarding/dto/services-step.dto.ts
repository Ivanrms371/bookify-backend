import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { CreateServiceBulkItemDto } from 'src/modules/services/dto/create-services-bulk.dto';

export class OnboardingServiceItemDto extends CreateServiceBulkItemDto {
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imagePublicId?: string;
}

export class ServicesStepDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OnboardingServiceItemDto)
  services: OnboardingServiceItemDto[];
}
