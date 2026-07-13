import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateServiceBulkItemDto } from 'src/modules/tenants/features/services/services/dto/create-services-bulk.dto';

export class ServicesStepDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateServiceBulkItemDto)
  services: CreateServiceBulkItemDto[];
}
