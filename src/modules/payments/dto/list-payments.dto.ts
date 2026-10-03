import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

const integerQuery = ({ value }: { value: unknown }) => (typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : value);

export class ListPaymentsDto {
  @Transform(integerQuery)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page: number = 1;

  @Transform(integerQuery)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}
