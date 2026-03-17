import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UploadFileBodyDto {
  @ApiProperty({ description: '业务模块标识，例如 avatar、document' })
  @IsString({ message: '业务模块必须是字符串' })
  @IsNotEmpty({ message: '业务模块不能为空' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: '业务模块只能包含字母、数字、下划线和中划线',
  })
  module: string;
}
