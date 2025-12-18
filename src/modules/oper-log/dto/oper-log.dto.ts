import {
    IsOptional,
    IsString,
    IsNumber,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 查询操作日志列表 DTO
 */
export class QueryOperLogDto {
    @ApiPropertyOptional({ description: '模块标题' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: '操作人员' })
    @IsOptional()
    @IsString()
    operName?: string;

    @ApiPropertyOptional({ description: '业务类型' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    businessType?: number;

    @ApiPropertyOptional({ description: '操作状态：0成功 1失败' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    status?: number;

    @ApiPropertyOptional({ description: '开始时间' })
    @IsOptional()
    @IsDateString()
    beginTime?: string;

    @ApiPropertyOptional({ description: '结束时间' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiPropertyOptional({ description: '页码', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ description: '每页数量', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;
}

/**
 * 创建操作日志 DTO（内部使用）
 */
export class CreateOperLogDto {
    @ApiProperty({ description: '模块标题' })
    title: string;

    @ApiProperty({ description: '业务类型' })
    businessType: number;

    @ApiPropertyOptional({ description: '请求方法' })
    method?: string;

    @ApiPropertyOptional({ description: '请求方式' })
    requestMethod?: string;

    @ApiPropertyOptional({ description: '操作人员' })
    operName?: string;

    @ApiPropertyOptional({ description: '部门名称' })
    deptName?: string;

    @ApiPropertyOptional({ description: '请求URL' })
    operUrl?: string;

    @ApiPropertyOptional({ description: '请求IP' })
    operIp?: string;

    @ApiPropertyOptional({ description: '操作地点' })
    operLocation?: string;

    @ApiPropertyOptional({ description: '请求参数' })
    operParam?: string;

    @ApiPropertyOptional({ description: '返回参数' })
    jsonResult?: string;

    @ApiProperty({ description: '操作状态', default: 0 })
    status: number;

    @ApiPropertyOptional({ description: '错误消息' })
    errorMsg?: string;

    @ApiProperty({ description: '操作时间' })
    operTime: Date;

    @ApiProperty({ description: '消耗时间（毫秒）' })
    costTime: number;
}
