# 架构设计

<!-- AI Context: 本文档描述项目结构和技术栈，适用于了解项目整体布局 -->

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | NestJS (`@nestjs/core`) |
| **语言** | TypeScript |
| **ORM** | Prisma (支持 MySQL、PostgreSQL、MongoDB) |
| **缓存** | Redis (使用 `ioredis` 连接) |
| **认证** | JWT (`@nestjs/jwt`, `passport`, `passport-jwt`) |
| **配置** | `@nestjs/config`, `joi` |
| **API 文档** | `@nestjs/swagger` |
| **代码规范** | ESLint, Prettier |
| **测试** | Jest, Supertest |

## 项目结构

```
/
├── .vscode/               # VSCode 编辑器配置
├── prisma/                # Prisma 配置目录
│   ├── schema.prisma      # 当前使用的 Prisma Schema（由脚本复制生成）
│   ├── schema.postgres.prisma  # PostgreSQL Schema
│   ├── schema.mysql.prisma     # MySQL Schema
│   └── schema.mongo.prisma     # MongoDB Schema
├── config/                # 配置文件
│   ├── configuration.ts   # 配置工厂函数
│   └── validation.ts      # 环境变量验证
├── dist/                  # 编译后的 JavaScript 代码
├── logs/                  # 日志文件
├── node_modules/          # 依赖包
├── public/                # 静态资源
├── scripts/               # 脚本文件
│   └── init-admin.ts      # 初始化管理员脚本
├── src/                   # 源代码
│   ├── app.controller.ts  # 主应用控制器
│   ├── app.module.ts      # 主应用模块
│   ├── app.service.ts     # 主应用服务
│   ├── common/            # 公共模块
│   │   ├── decorator/     # 自定义装饰器
│   │   ├── dto/           # 数据传输对象
│   │   ├── filters/       # 过滤器
│   │   ├── guards/        # 守卫
│   │   ├── interceptor/   # 拦截器
│   │   ├── modules/       # 公共基础设施模块
│   │   │   └── prisma/    # Prisma 数据库服务
│   │   ├── pipes/         # 管道
│   │   ├── utils/         # 工具函数（ID验证等）
│   │   └── logger.ts      # 日志配置
│   ├── config/            # 配置模块
│   ├── main.ts            # 应用入口文件
│   └── modules/           # 业务模块
│       ├── auth/          # 认证模块
│       ├── common/        # 公共基础设施模块
│       │   ├── file/      # 文件存储服务
│       │   └── redis/     # Redis 缓存服务
│       └── system/        # 系统管理模块
│           ├── user/      # 用户管理
│           ├── role/      # 角色管理
│           ├── dept/      # 部门管理
│           ├── menu/      # 菜单管理
│           └── oper-log/  # 操作日志
├── test/                  # 测试文件
├── .env.example           # 环境变量示例文件
├── .eslintrc.js           # ESLint 配置文件
├── .gitignore             # Git 忽略文件
├── .prettierrc            # Prettier 配置文件
├── nest-cli.json          # Nest CLI 配置文件
├── package.json           # 项目依赖和脚本
├── tsconfig.build.json    # TypeScript 编译配置（用于构建）
└── tsconfig.json          # TypeScript 编译配置（含路径别名 @/* -> src/*）
```

## 路径别名

项目配置了 TypeScript 路径别名，使用 `@/*` 指向 `src/*` 目录，简化跨目录导入：

```typescript
// 之前
import { AuthGuard } from '../../../common/guards/auth.guard';

// 现在
import { AuthGuard } from '@/common/guards/auth.guard';
```

## 启动流程 (`src/main.ts`)

应用程序的入口点是 `src/main.ts` 文件。它负责：

1. **创建 NestJS 应用实例:** 使用 `NestFactory.create()` 创建一个 NestJS 应用。
2. **设置全局前缀:** 为所有路由设置一个统一的前缀 `api`。
3. **配置静态资源:** 将 `public` 目录下的文件作为静态资源，可通过 `/static` 路径访问。
4. **初始化 Swagger:**
   - 使用 `DocumentBuilder` 创建 Swagger 文档的基本信息（标题、描述、版本）。
   - 使用 `SwaggerModule.createDocument()` 创建完整的 Swagger 文档。
   - 通过 `SwaggerModule.setup()` 在 `/api/v1/swagger` 路径上启用 Swagger UI。
5. **启用 CORS:** 允许跨域资源共享。
6. **注册全局组件:**
   - `HttpExceptionFilter`: 全局异常过滤器，用于捕获和处理 HTTP 异常，并记录错误日志。
   - `TransformReturnInterceptor`: 全局拦截器，用于统一成功响应的返回格式。
   - `LoggingInterceptor`: 全局日志拦截器，记录所有请求的日志信息。
   - `ValidationPipe`: 全局管道，使用 `class-validator` 自动验证所有传入的 DTO (Data Transfer Object)。
7. **启动应用:** 在端口 `3000` 上监听应用。
