import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 用户分页查询 DTO
 */
export class QueryUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '用户名（模糊匹配）' })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '昵称（模糊匹配）' })
  nickName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '手机号' })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  @ApiPropertyOptional({ description: '状态：0-启用，1-停用' })
  status?: number;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ description: '部门ID' })
  deptId?: string;
}
