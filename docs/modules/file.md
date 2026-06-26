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

| 方法 | 路径                     | 描述                  | 认证 |
| ---- | ------------------------ | --------------------- | ---- |
| POST | `/api/file/upload`       | 单文件上传            | 可选 |
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

上传接口使用 `memoryStorage` 接收文件，再由 `LocalStorage` 或 `OssStorage` 负责最终存储。默认本地存储会：

- 将文件写入 `UPLOAD_ROOT` 指定的真实磁盘目录。
- 按业务模块和日期分目录保存，例如 `${UPLOAD_ROOT}/avatar/20260626/xxx.jpg`。
- 对外只返回公共路径 `uploads/avatar/20260626/xxx.jpg`，访问 URL 为 `${APP_BASE_URL}/uploads/avatar/20260626/xxx.jpg`。

线上部署时建议把 `UPLOAD_ROOT` 配到不会被发版覆盖的目录，例如：

```bash
UPLOAD_ROOT=/data/nexus/uploads
APP_BASE_URL=https://api.example.com
```

并确保 Node 进程用户有写入权限：

```bash
sudo mkdir -p /data/nexus/uploads
sudo chown -R <node运行用户>:<node运行用户> /data/nexus/uploads
```

本地开发可保持默认值：

```bash
UPLOAD_ROOT=uploads
```

### LocalStorage 核心逻辑

```typescript
const uploadRoot = configService.get<string>('file.uploadRoot') || 'uploads';
const uploadDir = path.join(uploadRoot, module, dateFolder);
const publicPath = path.posix.join('uploads', module, dateFolder, filename);

fs.mkdirSync(uploadDir, { recursive: true });
fs.writeFileSync(path.join(uploadDir, filename), file.buffer);

return {
  path: publicPath,
  url: `${baseUrl}/${publicPath}`,
};
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
  constructor(
    @Inject(STORAGE_STRATEGY)
    private readonly storage: IStorageStrategy,
  ) {}

  async processUploadedFile(
    file: Express.Multer.File,
    module: string,
  ): Promise<FileInfoDto> {
    const result = await this.storage.upload(file, module);
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
    "path": "uploads/avatar/20240101/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "extension": ".jpg",
    "uploadTime": "2024-01-01T12:00:00.000Z",
    "url": "http://localhost:3000/uploads/avatar/20240101/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
  }
}
```

## 工作流程

1. 客户端发起 `multipart/form-data` 请求
2. `FileInterceptor` / `FilesInterceptor` 拦截请求
3. `FileValidationPipe` 验证文件大小
4. `FileService` 调用当前存储策略
5. 本地存储写入 `UPLOAD_ROOT`，并生成 `uploads/...` 公共路径
6. 返回 `FileInfoDto` 响应
