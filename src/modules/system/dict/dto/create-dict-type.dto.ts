import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDictTypeDto {
  @IsString()
  @IsNotEmpty({ message: '字典名称不能为空' })
  dictName: string;

  @IsString()
  @IsNotEmpty({ message: '字典类型不能为空' })
  dictType: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
