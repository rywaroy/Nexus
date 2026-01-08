# 文件上传模块

<!-- AI Context: 本文档描述 file 模块，包括文件上传、存储和验证 -->

## 概述

`file` 模块提供单文件和多文件上传功能，支持本地存储和阿里云 OSS。

**文件位置:** `src/modules/common/file/`

## 模块结构

```
file/
├── file.module.ts         # 模块定义
├── file.controller.ts     # 控制器
├── file.service.ts        # 服务
├── filevalidation.pipe.ts # 文件验证管道
└── dto/
    ├── file-info.dto.ts   # 单文件响应 DTO
    └── files-info.dto.ts  # 多文件响应 DTO
```

## API 接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/file/upload` | 单文件上传 | 可选 |
| POST | `/api/file/upload-files` | 多文件上传（最多3个） | 可选 |

## FileController

```typescript
@ApiTags('文件管理')
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @UseInterceptors(FileInterceptor('file', { storage: ... }))
    @Post('upload')
    uploadFile(@UploadedFile(FileValidationPipe) file: Express.Multer.File): FileInfoDto {
        return this.fileService.processUploadedFile(file);
    }

    @UseInterceptors(FilesInterceptor('files', 3, { storage: ... }))
    @Post('upload-files')
    uploadFiles(@UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>): FileInfoDto[] {
        return this.fileService.processUploadedFiles(files);
    }
}
```

## 文件存储策略

```typescript
const storage = diskStorage({
    destination: (req, file, cb) => {
        // 按日期创建目录：uploads/20240101/
        const dateDir = dayjs().format('YYYYMMDD');
        const uploadPath = path.join('uploads', dateDir);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 使用 UUID + 原始扩展名
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});
```

## 文件验证管道

```typescript
@Injectable()
export class FileValidationPipe implements PipeTransform {
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
```

## FileService

```typescript
@Injectable()
export class FileService {
    processUploadedFile(file: Express.Multer.File): FileInfoDto {
        const fileExtension = path.extname(file.originalname);
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
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

    processUploadedFiles(files: Array<Express.Multer.File>): FileInfoDto[] {
        return files.map(file => this.processUploadedFile(file));
    }
}
```

## 响应格式

### 单文件上传响应

```json
{
    "code": 0,
    "message": "请求成功",
    "data": {
        "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
        "originalname": "avatar.jpg",
        "mimetype": "image/jpeg",
        "size": 102400,
        "path": "uploads/20240101/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
        "extension": ".jpg",
        "uploadTime": "2024-01-01T12:00:00.000Z",
        "url": "http://localhost:3000/uploads/20240101/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
    }
}
```

## 工作流程

1. 客户端发起 `multipart/form-data` 请求
2. `FileInterceptor` / `FilesInterceptor` 拦截请求
3. `diskStorage` 创建日期目录，生成 UUID 文件名，保存文件
4. `FileValidationPipe` 验证文件大小
5. `FileService` 处理文件信息，生成访问 URL
6. 返回 `FileInfoDto` 响应
