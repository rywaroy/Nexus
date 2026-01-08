# 配置管理

<!-- AI Context: 本文档描述配置系统，包括环境变量、配置工厂和验证，适用于修改配置项 -->

## 概述

项目使用 `@nestjs/config` 模块进行配置管理，配合 `Joi` 进行环境变量验证。

## 环境变量

项目使用 `.env` 文件来管理环境变量，并通过 `.env.example` 提供了一个配置模板。

```bash
cp .env.example .env
```

**关键配置项:**

```bash
# 数据库连接（选择其一）
# PostgreSQL:
DATABASE_URL="postgresql://user:password@localhost:5432/nexus?schema=public"
# MySQL:
DATABASE_URL="mysql://user:password@localhost:3306/nexus"
# MongoDB:
DATABASE_URL="mongodb://user:password@localhost:27017/nexus?authSource=admin"

# 数据库类型（用于 ID 验证）
DATABASE_TYPE=postgres  # 或 mysql / mongodb

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 应用配置
APP_PORT=3000
NODE_ENV=development
```

## 配置工厂 (`src/config/configuration.ts`)

配置工厂函数将环境变量组织成一个结构清晰、易于访问的 JavaScript 对象。

```typescript
export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'yourSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    database: parseInt(process.env.REDIS_DB) || 0,
  },
});
```

**关键点:**

- **结构化:** 相关的配置项组合在一起，例如 `configService.get('database.url')`。
- **类型转换:** 将字符串转换为程序需要的类型，如 `parseInt()`。
- **默认值:** 确保即使没有 `.env` 文件也能以默认配置启动。

## 环境变量验证 (`src/config/validation.ts`)

使用 `Joi` 库定义验证模式，在应用启动时检查环境变量。

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'online')
    .default('development'),
  APP_PORT: Joi.number().default(3000),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Database (Prisma)
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  // ... 其他 Redis 配置
});
```

**关键点:**

- **强制性规则:** `.required()` 指定必需的环境变量，如 `JWT_SECRET` 和 `DATABASE_URL`。
- **类型和格式验证:** 如 `Joi.number()`、`Joi.string().valid(...)`。
- **启动时验证:** "快速失败"策略，尽早发现配置错误。

## 如何协同工作

在 `app.module.ts` 中配置：

```typescript
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,           // 全局模块，任何地方可注入 ConfigService
            load: [configuration],     // 加载配置工厂
            validationSchema,          // 启动时验证环境变量
        }),
        PrismaModule,
        // ... 其他模块
    ],
})
export class AppModule {}
```

## 在代码中使用配置

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SomeService {
    constructor(private configService: ConfigService) {}

    someMethod() {
        const jwtSecret = this.configService.get('jwt.secret');
        const dbUrl = this.configService.get('database.url');
    }
}
```
