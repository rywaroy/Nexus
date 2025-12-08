import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';

/**
 * 创建部门 DTO
 */
export class CreateDeptDto {
    /** 部门名称 */
    @IsString()
    @IsNotEmpty({ message: '部门名称不能为空' })
    @MinLength(2, { message: '部门名称至少2个字符' })
    @MaxLength(50, { message: '部门名称最多50个字符' })
    name: string;

    /** 父级部门ID，根节点传 null 或空字符串 */
    @IsOptional()
    @Transform(({ value }) => (value === '' ? null : value))
    @ValidateIf((_, value) => value !== null && value !== undefined)
    @IsMongoId({ message: '父级部门ID格式不正确' })
    pid?: string | null;

    /** 状态：0-启用，1-停用 */
    @IsOptional()
    @Type(() => Number)
    @IsIn([0, 1], { message: '状态值只能是0或1' })
    status?: number;

    /** 备注 */
    @IsOptional()
    @IsString({ message: '备注必须为字符串' })
    @MaxLength(200, { message: '备注最多200个字符' })
    remark?: string;
}
