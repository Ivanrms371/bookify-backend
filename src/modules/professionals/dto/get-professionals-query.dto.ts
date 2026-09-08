import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class GetProfessionalsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido (v4 o v7)' })
  serviceId?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.asc;

  @IsOptional()
  @IsIn(['name', 'lastName', 'email', 'isActive', 'createdAt'])
  orderBy?: 'name' | 'lastName' | 'email' | 'isActive' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  take?: number = 24;
}
