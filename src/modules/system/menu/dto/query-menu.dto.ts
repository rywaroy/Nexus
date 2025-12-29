import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { IsId } from '@/common/decorators/is-id.decorator';
import { MenuType } from '../entities/menu.entity';

export class QueryMenuDto {
  /** 菜单名称（模糊匹配） */
  @IsOptional()
  @IsString()
  name?: string;

  /** 菜单标题（模糊匹配） */
  @IsOptional()
  @IsString()
  title?: string;

  /** 状态：0-启用，1-停用 */
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  /** 菜单类型 */
  @IsOptional()
  @IsEnum(MenuType)
  type?: MenuType;

  /** 父级菜单ID */
  @IsOptional()
  @IsId({ message: '父级菜单ID格式不正确' })
  parentId?: string;
}
