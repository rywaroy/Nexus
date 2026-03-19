import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { IsId } from '@/common/decorators/is-id.decorator';

export class QueryDictDataDto {
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

  @IsId({ message: '字典类型ID格式不正确' })
  @IsOptional()
  typeId?: string;

  @IsString()
  @IsOptional()
  dictType?: string;

  @IsString()
  @IsOptional()
  dictLabel?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;
}
