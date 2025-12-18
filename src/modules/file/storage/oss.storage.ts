import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as OSS from 'ali-oss';
import { IStorageStrategy, UploadResult } from './storage.interface';

@Injectable()
export class OssStorage implements IStorageStrategy {
  private readonly logger = new Logger(OssStorage.name);
  private readonly client: OSS;
  private readonly dir: string;

  constructor(private readonly configService: ConfigService) {
    const ossConfig = this.configService.get('oss');
    this.dir = ossConfig.dir || 'uploads';

    const clientOptions: OSS.Options = {
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      region: ossConfig.region,
    };

    // 如果配置了自定义 endpoint，使用 endpoint 而不是 region
    if (ossConfig.endpoint) {
      clientOptions.endpoint = ossConfig.endpoint;
      delete clientOptions.region;
    }

    this.client = new OSS(clientOptions);
    this.logger.log(`OSS 存储已初始化，Bucket: ${ossConfig.bucket}`);
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}${month}${day}`;

    const extension = path.extname(file.originalname);
    const uuid = uuidv4();
    const filename = `${uuid}${extension}`;
    const ossPath = `${this.dir}/${dateFolder}/${filename}`;

    // 上传到 OSS
    const result = await this.client.put(ossPath, file.buffer);

    this.logger.debug(`文件已上传到 OSS: ${ossPath}`);

    return {
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: ossPath,
      url: result.url,
    };
  }
}
