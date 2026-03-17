import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FileService } from './file.service';
import { FileValidationPipe } from './filevalidation.pipe';
import { FileInfoDto } from './dto/file-info.dto';
import { FilesInfoDto } from './dto/files-info.dto';
import { ApiResponse } from '@/common/decorator/api-response.decorator';
import { UploadFileBodyDto } from './dto/upload-file-body.dto';

@ApiTags('文件管理')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 获取multer存储配置（使用内存存储以支持 OSS）
   */
  private static getMulterConfig() {
    const maxSizeMB = parseInt(process.env.FILE_MAX_SIZE_MB) || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    return {
      storage: memoryStorage(),
      limits: {
        fileSize: maxSizeBytes,
      },
    };
  }

  @UseInterceptors(FileInterceptor('file', FileController.getMulterConfig()))
  @Post('upload')
  @ApiOperation({
    summary: '单文件上传',
    description: '上传单个文件并返回文件信息',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '文件上传',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      required: ['module', 'file'],
      properties: {
        module: {
          type: 'string',
          description: '业务模块标识，例如 avatar',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
      },
    },
  })
  @ApiResponse(FileInfoDto, '文件上传成功')
  async uploadFile(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() body: UploadFileBodyDto,
  ): Promise<FileInfoDto> {
    return this.fileService.processUploadedFile(file, body.module);
  }

  @UseInterceptors(
    FilesInterceptor('files', 3, FileController.getMulterConfig()),
  )
  @Post('upload-files')
  @ApiOperation({
    summary: '多文件上传',
    description: '上传多个文件并返回文件信息列表',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '多文件上传',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      required: ['module', 'files'],
      properties: {
        module: {
          type: 'string',
          description: '业务模块标识，例如 avatar',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '要上传的文件列表',
        },
      },
    },
  })
  @ApiResponse(FilesInfoDto, '文件上传成功')
  async uploadFiles(
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
    @Body() body: UploadFileBodyDto,
  ): Promise<FileInfoDto[]> {
    return this.fileService.processUploadedFiles(files, body.module);
  }
}
