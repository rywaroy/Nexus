import { Injectable } from '@nestjs/common';
import { FileInfoDto } from './dto/file-info.dto';
import * as path from 'path';

@Injectable()
export class FileService {
    /**
     * 处理上传的文件，返回文件信息
     * @param file 上传的文件
     * @returns 文件信息
     */
    processUploadedFile(file: Express.Multer.File): FileInfoDto {
        const fileExtension = path.extname(file.originalname);
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

        // 生成相对路径用于URL（统一使用正斜杠）
        const relativePath = file.path.replace(/\\/g, '/');

        return {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            extension: fileExtension,
            uploadTime: new Date(),
            url: `${baseUrl}/${relativePath}`,
        };
    }

    /**
     * 处理多个上传的文件，返回文件信息数组
     * @param files 上传的文件数组
     * @returns 文件信息数组
     */
    processUploadedFiles(files: Express.Multer.File[]): FileInfoDto[] {
        return files.map((file) => this.processUploadedFile(file));
    }
}
