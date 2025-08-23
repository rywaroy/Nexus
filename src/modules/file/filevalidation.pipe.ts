import {
    PipeTransform,
    Injectable,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
    transform(value: Express.Multer.File) {
        if (value.size > 10 * 1024 * 1024) {
            throw new HttpException('文件大小超过10M', HttpStatus.OK);
        }
        return value;
    }
}
