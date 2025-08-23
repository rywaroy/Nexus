import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiPropertyOptional({
        description: '用户名',
        required: true,
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    @ApiPropertyOptional({
        description: '密码',
        required: true,
    })
    password: string;
}
