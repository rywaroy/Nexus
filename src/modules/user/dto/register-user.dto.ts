import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * 用户注册 DTO
 * 只允许提供基础字段，roles/status/deptId 等由服务端控制
 */
export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(3, 20, { message: '用户名长度必须在 3-20 位之间' })
  @Matches(/^[\w-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度必须在 6-20 位之间' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(1, 20, { message: '昵称长度必须在 1-20 位之间' })
  nickName: string;
}
