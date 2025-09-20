import {
  IsOptional,
  IsDateString,
  IsString,
  IsIn,
  IsArray,
} from 'class-validator';

type GroupByOption = 'status' | 'supplierId' | 'month' | 'year';

export class QueryFiltersDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['status', 'supplier', 'date'], { each: true })
  groupBy?: GroupByOption[];
}
