import { ApiProperty } from '@nestjs/swagger';
import { FileInfoDto } from './file-info.dto';

export class FilesInfoDto {
    @ApiProperty({ description: '文件信息列表', type: [FileInfoDto] })
    files: FileInfoDto[];
}
