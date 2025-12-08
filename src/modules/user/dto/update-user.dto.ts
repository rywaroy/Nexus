import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * 用户更新 DTO
 * 继承 CreateUserDto，但排除 username 和 password（不可修改）
 * 所有字段均为可选
 */
export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['username', 'password'] as const),
) {}
