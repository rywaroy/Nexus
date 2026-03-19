import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsId } from '@/common/decorators/is-id.decorator';

export class CreateDictDataDto {
  @IsId({ message: '字典类型ID格式不正确' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  typeId: string;

  @IsString()
  @IsNotEmpty({ message: '字典标签不能为空' })
  dictLabel: string;

  @IsString()
  @IsNotEmpty({ message: '字典键值不能为空' })
  dictValue: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  dictSort?: number;

  @IsString()
  @IsOptional()
  cssClass?: string;

  @IsString()
  @IsOptional()
  listClass?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
