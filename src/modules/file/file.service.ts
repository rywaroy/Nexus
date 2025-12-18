import { Inject, Injectable } from '@nestjs/common';
import { FileInfoDto } from './dto/file-info.dto';
import * as path from 'path';
import { IStorageStrategy, STORAGE_STRATEGY } from './storage';

@Injectable()
export class FileService {
  constructor(
    @Inject(STORAGE_STRATEGY)
    private readonly storage: IStorageStrategy,
  ) {}

  /**
   * 处理上传的文件，返回文件信息
   * @param file 上传的文件
   * @returns 文件信息
   */
  async processUploadedFile(file: Express.Multer.File): Promise<FileInfoDto> {
    const result = await this.storage.upload(file);
    return {
      filename: result.filename,
      originalname: result.originalname,
      mimetype: result.mimetype,
      size: result.size,
      path: result.path,
      extension: path.extname(result.originalname),
      uploadTime: new Date(),
      url: result.url,
    };
  }

  /**
   * 处理多个上传的文件，返回文件信息数组
   * @param files 上传的文件数组
   * @returns 文件信息数组
   */
  async processUploadedFiles(
    files: Express.Multer.File[],
  ): Promise<FileInfoDto[]> {
    return Promise.all(files.map((file) => this.processUploadedFile(file)));
  }
}
