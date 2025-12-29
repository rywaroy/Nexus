import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsId } from '@/common/decorators/is-id.decorator';
import { Type } from 'class-transformer';
import { BadgeType, BadgeVariants, MenuType } from '../entities/menu.entity';

export class CreateMenuDto {
  /** 菜单名称（路由 name） */
  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @MinLength(2, { message: '菜单名称最少2个字符' })
  @MaxLength(50, { message: '菜单名称最多50个字符' })
  name: string;

  /** 菜单标题 */
  @IsString()
  @IsNotEmpty({ message: '菜单标题不能为空' })
  @MaxLength(50, { message: '菜单标题最多50个字符' })
  title: string;

  /** 父级菜单ID */
  @IsOptional()
  @IsId({ message: '父级菜单ID格式不正确' })
  parentId?: string;

  /** 路由路径 */
  @IsString()
  @IsNotEmpty({ message: '路由路径不能为空' })
  @MaxLength(200, { message: '路由路径最多200个字符' })
  path: string;

  /** 组件路径 */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '组件路径最多200个字符' })
  component?: string;

  /** 菜单类型 */
  @IsEnum(MenuType, { message: '菜单类型不正确' })
  type: MenuType;

  /** 权限标识 */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '权限标识最多100个字符' })
  authCode?: string;

  /** 排序值 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '排序值必须为数字' })
  order?: number;

  /** 状态：0-启用，1-停用 */
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1], { message: '状态值只能是0或1' })
  status?: number;

  /** 菜单图标 */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '图标最多100个字符' })
  icon?: string;

  /** 激活时的图标 */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '激活图标最多100个字符' })
  activeIcon?: string;

  /** 是否缓存页面 */
  @IsOptional()
  @IsBoolean({ message: 'keepAlive必须为布尔值' })
  keepAlive?: boolean;

  /** 是否固定在标签栏 */
  @IsOptional()
  @IsBoolean({ message: 'affixTab必须为布尔值' })
  affixTab?: boolean;

  /** 是否在菜单中隐藏 */
  @IsOptional()
  @IsBoolean({ message: 'hideInMenu必须为布尔值' })
  hideInMenu?: boolean;

  /** 是否在菜单中隐藏子级 */
  @IsOptional()
  @IsBoolean({ message: 'hideChildrenInMenu必须为布尔值' })
  hideChildrenInMenu?: boolean;

  /** 是否在面包屑中隐藏 */
  @IsOptional()
  @IsBoolean({ message: 'hideInBreadcrumb必须为布尔值' })
  hideInBreadcrumb?: boolean;

  /** 是否在标签页中隐藏 */
  @IsOptional()
  @IsBoolean({ message: 'hideInTab必须为布尔值' })
  hideInTab?: boolean;

  /** iframe 地址 */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'iframe地址最多500个字符' })
  iframeSrc?: string;

  /** 外链地址 */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '外链地址最多500个字符' })
  link?: string;

  /** 激活路径 */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '激活路径最多200个字符' })
  activePath?: string;

  /** 徽标内容 */
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '徽标内容最多20个字符' })
  badge?: string;

  /** 徽标类型 */
  @IsOptional()
  @IsEnum(BadgeType, { message: '徽标类型不正确' })
  badgeType?: BadgeType;

  /** 徽标颜色 */
  @IsOptional()
  @IsEnum(BadgeVariants, { message: '徽标颜色不正确' })
  badgeVariants?: BadgeVariants;
}
