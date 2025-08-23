import { ApiProperty } from '@nestjs/swagger';

export class FileInfoDto {
    @ApiProperty({ description: '文件名' })
    filename: string;

    @ApiProperty({ description: '原始文件名' })
    originalname: string;

    @ApiProperty({ description: '文件MIME类型' })
    mimetype: string;

    @ApiProperty({ description: '文件大小（字节）' })
    size: number;

    @ApiProperty({ description: '文件路径' })
    path: string;

    @ApiProperty({ description: '文件扩展名' })
    extension: string;

    @ApiProperty({ description: '上传时间' })
    uploadTime: Date;

    @ApiProperty({ description: '文件URL', required: false })
    url?: string;
}
