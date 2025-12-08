import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * 查询部门 DTO
 */
export class QueryDeptDto {
    /** 按名称模糊搜索 */
    @IsOptional()
    @IsString()
    name?: string;

    /** 状态过滤：0-启用，1-停用 */
    @IsOptional()
    @Type(() => Number)
    @IsIn([0, 1])
    status?: number;
}
