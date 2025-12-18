import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class QueryRoleDto {
  /** 当前页码 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** 每页数量 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number = 10;

  /** 状态：0-启用，1-停用 */
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  /** 角色名称（模糊匹配） */
  @IsOptional()
  @IsString()
  name?: string;
}
