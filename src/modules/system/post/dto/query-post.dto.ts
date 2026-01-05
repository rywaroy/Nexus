import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number;

  @IsString()
  @IsOptional()
  postCode?: string;

  @IsString()
  @IsOptional()
  postName?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;
}
