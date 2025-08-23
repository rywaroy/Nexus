import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
    @ApiProperty({ description: '状态码' })
    code: number;

    @ApiProperty({ description: '提示信息' })
    message: string;

    data: T;
}
