import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  /** 角色名称 */
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string;

  /** 权限标识数组 */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  /** 备注 */
  @IsOptional()
  @IsString()
  remark?: string;

  /** 状态：0-启用，1-停用，默认启用 */
  @IsOptional()
  @IsIn([0, 1], { message: '状态值必须为 0 或 1' })
  status?: number;
}
