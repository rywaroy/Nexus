import {
    PipeTransform,
    Injectable,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
    constructor(private readonly configService: ConfigService) {}

    transform(value: Express.Multer.File) {
        const maxSizeMB = this.configService.get<number>('file.maxSizeMB', 10);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (value.size > maxSizeBytes) {
            throw new HttpException(
                `文件大小超过${maxSizeMB}M`,
                HttpStatus.BAD_REQUEST,
            );
        }
        return value;
    }
}
