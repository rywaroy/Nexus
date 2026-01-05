import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsId } from '@/common/decorators/is-id.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '用户名', required: true })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  @ApiProperty({ description: '密码（6-20位）', required: true })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '昵称', required: true })
  nickName: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @ApiPropertyOptional({ description: '邮箱' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  @ApiPropertyOptional({ description: '手机号' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '头像 URL' })
  avatar?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1], { message: '状态值只能是 0 或 1' })
  @ApiPropertyOptional({ description: '状态：0-启用，1-停用', default: 0 })
  status?: number;

  @IsOptional()
  @IsId({ message: '部门ID格式不正确' })
  @ApiPropertyOptional({ description: '部门ID' })
  deptId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '备注最多200个字符' })
  @ApiPropertyOptional({ description: '备注' })
  remark?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: '角色名称数组，默认 user',
    isArray: true,
    type: String,
  })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsId({ each: true, message: '岗位ID格式不正确' })
  @ApiPropertyOptional({
    description: '岗位ID数组',
    isArray: true,
    type: String,
  })
  postIds?: string[];
}
