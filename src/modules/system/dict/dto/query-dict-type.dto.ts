import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryDictTypeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;

  @IsString()
  @IsOptional()
  dictName?: string;

  @IsString()
  @IsOptional()
  dictType?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;
}
