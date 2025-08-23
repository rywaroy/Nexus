# 配置系统迁移说明

## 概述

项目已从硬编码的配置文件迁移到使用 `@nestjs/config` 和环境变量的现代化配置系统。

## 主要变更

### 1. 新增依赖
- `@nestjs/config`: NestJS 官方配置管理包
- `joi`: 用于环境变量验证
- `@types/joi`: Joi 的类型定义

### 2. 配置文件结构

#### 新增文件：
- `.env`: 环境变量配置文件（已添加到 .gitignore）
- `.env.example`: 环境变量配置示例
- `src/config/configuration.ts`: 配置工厂函数
- `src/config/validation.ts`: 环境变量验证模式

#### 删除文件：
- `src/config/constants.ts`: 旧的硬编码配置文件

### 3. 环境变量配置

```bash
# Application
NODE_ENV=development
APP_PORT=3000

# JWT Configuration
JWT_SECRET=yourSecretKey
JWT_EXPIRES_IN=24h

# MongoDB Configuration
MONGODB_HOST=127.0.0.1
MONGODB_PORT=27017
MONGODB_DB=test
MONGODB_USER=
MONGODB_PASS=

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 4. 主要代码变更

#### AppModule
- 集成了 `ConfigModule.forRoot()` 作为全局模块
- MongoDB 连接现在使用 `MongooseModule.forRootAsync()` 
- 添加了环境变量验证

#### AuthModule
- JWT 配置现在使用 `JwtModule.registerAsync()`
- 通过 `ConfigService` 获取 JWT 配置

#### JwtStrategy
- 构造函数现在注入 `ConfigService`
- JWT secret 通过 `configService.get('jwt.secret')` 获取

#### RedisService
- 构造函数现在注入 `ConfigService`
- Redis 连接配置通过 `configService.get('redis')` 获取

#### AuthGuard
- 新增 `ConfigService` 依赖注入
- JWT 验证密钥通过配置服务获取

## 使用方法

### 1. 环境配置
复制 `.env.example` 为 `.env` 并根据你的环境配置相应的值：

```bash
cp .env.example .env
```

### 2. 在服务中使用配置

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const jwtSecret = this.configService.get('jwt.secret');
    const mongoHost = this.configService.get('mongodb.host');
    const redisConfig = this.configService.get('redis');
  }
}
```

### 3. 配置验证
环境变量会在应用启动时通过 Joi 模式进行验证，如果必需的变量缺失或格式不正确，应用会启动失败。

## 优势

1. **安全性**: 敏感信息（如 JWT secret）不再硬编码在源码中
2. **灵活性**: 可以针对不同环境（开发、测试、生产）使用不同的配置
3. **验证**: 自动验证环境变量的格式和必需性
4. **类型安全**: 通过 TypeScript 和配置模式提供类型安全
5. **标准化**: 使用 NestJS 官方推荐的配置管理方式

## 注意事项

- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
- 在生产环境中，应该通过环境变量或配置管理系统设置这些值
- 如需添加新的配置项，需要同时更新 `configuration.ts` 和 `validation.ts`
