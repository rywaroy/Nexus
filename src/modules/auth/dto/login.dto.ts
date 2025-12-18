import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '用户名', required: true })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  @ApiProperty({ description: '密码（6-20位）', required: true })
  password: string;
}
