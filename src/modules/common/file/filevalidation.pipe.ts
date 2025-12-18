import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) { }

  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new HttpException('请选择要上传的文件', HttpStatus.BAD_REQUEST);
    }

    const maxSizeMB = this.configService.get<number>('file.maxSizeMB', 10);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const files = Array.isArray(value) ? value : [value];
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        throw new HttpException(
          `文件 ${file.originalname} 大小超过${maxSizeMB}M`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return value;
  }
}
