import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IStorageStrategy, UploadResult } from './storage.interface';

const PUBLIC_UPLOAD_PREFIX = 'uploads';

@Injectable()
export class LocalStorage implements IStorageStrategy {
  constructor(private readonly configService: ConfigService) {}

  async upload(
    file: Express.Multer.File,
    module: string,
  ): Promise<UploadResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}${month}${day}`;
    const uploadRoot = this.getUploadRoot();
    const uploadDir = path.join(uploadRoot, module, dateFolder);
    const publicDir = path.posix.join(PUBLIC_UPLOAD_PREFIX, module, dateFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = path.extname(file.originalname);
    const uuid = uuidv4();
    const filename = `${uuid}${extension}`;
    const filePath = path.join(uploadDir, filename);
    const publicPath = path.posix.join(publicDir, filename);

    // 如果文件是通过 memoryStorage 上传的，需要写入磁盘
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      // 如果已经在磁盘上，直接使用
      // 这种情况下 file.path 已经是最终路径
      const publicPath = this.toPublicPath(file.path);
      return {
        filename: file.filename || filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: publicPath,
        url: this.generateUrl(publicPath),
      };
    }

    return {
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: publicPath,
      url: this.generateUrl(publicPath),
    };
  }

  private getUploadRoot(): string {
    return path.resolve(
      this.configService.get<string>('file.uploadRoot') || PUBLIC_UPLOAD_PREFIX,
    );
  }

  private toPublicPath(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedUploadRoot = this.getUploadRoot().replace(/\\/g, '/');

    if (
      normalizedPath === normalizedUploadRoot ||
      normalizedPath.startsWith(`${normalizedUploadRoot}/`)
    ) {
      const relativePath = normalizedPath
        .slice(normalizedUploadRoot.length)
        .replace(/^\/+/, '');

      return path.posix.join(PUBLIC_UPLOAD_PREFIX, relativePath);
    }

    const marker = `/${PUBLIC_UPLOAD_PREFIX}/`;
    const markerIndex = normalizedPath.lastIndexOf(marker);

    if (markerIndex >= 0) {
      return normalizedPath.slice(markerIndex + 1);
    }

    if (normalizedPath.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
      return normalizedPath;
    }

    return path.posix.join(
      PUBLIC_UPLOAD_PREFIX,
      path.posix.basename(normalizedPath),
    );
  }

  private generateUrl(filePath: string): string {
    const baseUrl =
      this.configService.get('app.baseUrl') || 'http://localhost:3000';
    const relativePath = filePath.replace(/\\/g, '/');
    return `${baseUrl}/${relativePath}`;
  }
}
