import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IStorageStrategy, UploadResult } from './storage.interface';

@Injectable()
export class LocalStorage implements IStorageStrategy {
  constructor(private readonly configService: ConfigService) {}

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}${month}${day}`;
    const uploadDir = `uploads/${dateFolder}`;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = path.extname(file.originalname);
    const uuid = uuidv4();
    const filename = `${uuid}${extension}`;
    const filePath = path.join(uploadDir, filename);

    // 如果文件是通过 memoryStorage 上传的，需要写入磁盘
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      // 如果已经在磁盘上，直接使用
      // 这种情况下 file.path 已经是最终路径
      return {
        filename: file.filename || filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: this.generateUrl(file.path),
      };
    }

    return {
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url: this.generateUrl(filePath),
    };
  }

  private generateUrl(filePath: string): string {
    const baseUrl =
      this.configService.get('app.baseUrl') || 'http://localhost:3000';
    const relativePath = filePath.replace(/\\/g, '/');
    return `${baseUrl}/${relativePath}`;
  }
}
