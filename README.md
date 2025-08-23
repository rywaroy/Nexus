## 简介

### **1. 项目概述**

Nexus 是一个基于 NestJS 框架构建的后端应用程序。它提供了一套完整的功能，包括：

  * **用户认证与授权:** 基于 JWT (JSON Web Token) 的用户认证机制，以及基于角色的访问控制 (RBAC)。
  * **数据库集成:** 使用 Mongoose 与 MongoDB 进行数据交互，并集成了 Redis 用于缓存。
  * **文件上传:** 支持单个和多个文件上传，并包含文件大小验证。
  * **配置管理:** 采用现代化的配置系统，通过环境变量进行灵活配置，并使用 Joi 进行验证。
  * **日志系统:** 使用 Winston 进行日志记录，包括控制台输出和每日轮换的日志文件。
  * **API 文档:** 集成 Swagger (OpenAPI) 自动生成和展示 API 文档。
  * **代码质量:** 使用 ESLint 和 Prettier 来确保代码风格的统一和质量。
  * **模块化结构:** 项目代码按功能模块进行组织，结构清晰，易于维护和扩展。

### **2. 技术栈**

  * **框架:** NestJS (`@nestjs/core`)
  * **语言:** TypeScript
  * **数据库:** MongoDB (使用 `mongoose` 连接), Redis (使用 `ioredis` 连接)
  * **认证:** JWT (`@nestjs/jwt`, `passport`, `passport-jwt`)
  * **配置:** `@nestjs/config`, `joi`
  * **API 文档:** `@nestjs/swagger`
  * **代码规范:** ESLint, Prettier
  * **测试:** Jest, Supertest

### **3. 项目结构**

```
/
├── .vscode/               # VSCode 编辑器配置
├── config/                # 配置文件
│   ├── configuration.ts   # 配置工厂函数
│   └── validation.ts      # 环境变量验证
├── dist/                  # 编译后的 JavaScript 代码
├── logs/                  # 日志文件
├── node_modules/          # 依赖包
├── public/                # 静态资源
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
│   │   ├── pipes/         # 管道
│   │   └── logger.ts      # 日志配置
│   ├── config/            # 配置模块
│   ├── main.ts            # 应用入口文件
│   └── modules/           # 业务模块
│       ├── auth/          # 认证模块
│       ├── file/          # 文件模块
│       ├── redis/         # Redis 模块
│       └── user/          # 用户模块
├── test/                  # 测试文件
├── .env.example           # 环境变量示例文件
├── .eslintrc.js           # ESLint 配置文件
├── .gitignore             # Git 忽略文件
├── .prettierrc            # Prettier 配置文件
├── nest-cli.json          # Nest CLI 配置文件
├── package.json           # 项目依赖和脚本
├── tsconfig.build.json    # TypeScript 编译配置（用于构建）
└── tsconfig.json          # TypeScript 编译配置
```

### **4. 核心功能详解**

#### **4.1. 启动流程 (`src/main.ts`)**

应用程序的入口点是 `src/main.ts` 文件。它负责：

1.  **创建 NestJS 应用实例:** 使用 `NestFactory.create()` 创建一个 NestJS 应用。
2.  **设置全局前缀:** 为所有路由设置一个统一的前缀 `api`。
3.  **配置静态资源:** 将 `public` 目录下的文件作为静态资源，可通过 `/static` 路径访问。
4.  **初始化 Swagger:**
      * 使用 `DocumentBuilder` 创建 Swagger 文档的基本信息（标题、描述、版本）。
      * 使用 `SwaggerModule.createDocument()` 创建完整的 Swagger 文档。
      * 通过 `SwaggerModule.setup()` 在 `/api/v1/swagger` 路径上启用 Swagger UI。
5.  **启用 CORS:** 允许跨域资源共享。
6.  **注册全局组件:**
      * `HttpExceptionFilter`: 全局异常过滤器，用于捕获和处理 HTTP 异常，并记录错误日志。
      * `TransformReturnInterceptor`: 全局拦截器，用于统一成功响应的返回格式。
      * `LoggingInterceptor`: 全局日志拦截器，记录所有请求的日志信息。
      * `ValidationPipe`: 全局管道，使用 `class-validator` 自动验证所有传入的 DTO (Data Transfer Object)。
7.  **启动应用:** 在端口 `3000` 上监听应用。

##### **4.2. 配置管理 (`src/config`)**

  * **环境变量:** 项目使用 `.env` 文件来管理环境变量，并通过 `.env.example` 提供了一个配置模板。
  * **配置模块 (`@nestjs/config`):** 在 `AppModule` 中，`ConfigModule` 被配置为全局模块，它会加载 `.env` 文件中的环境变量。
  * **类型安全的配置:**
      * `src/config/configuration.ts`: 定义了一个函数，它将环境变量组织成一个嵌套的配置对象，方便在代码中通过 `configService.get('database.host')` 这样的方式进行访问。
      * `src/config/validation.ts`: 使用 Joi 定义了一个验证模式，用于在应用启动时验证环境变量是否符合预期的格式和要求。如果验证失败，应用将无法启动，从而确保了配置的正确性。

##### **4.3. 认证与授权 (`src/modules/auth`, `src/common/guards`)**

  * **JWT 策略:**
      * **登录:** `AuthController` 的 `/login` 接口接收用户名和密码，调用 `AuthService` 进行验证。
      * **令牌生成:** `AuthService` 在验证成功后，会使用 `@nestjs/jwt` 的 `JwtService` 来生成一个 JWT。令牌的密钥和过期时间是通过 `ConfigService` 从环境变量中获取的。
      * **令牌验证:** `AuthGuard` 是一个全局守卫，它会从请求头中提取 JWT，并使用 `JwtService` 进行验证。验证通过后，会将用户信息附加到请求对象上。
  * **Passport:**
      * `JwtStrategy` 继承自 `PassportStrategy`，定义了 JWT 的验证逻辑。
  * **角色守卫 (`RoleGuard`):**
      * 这是一个自定义的守卫，用于实现基于角色的访问控制。
      * 它会检查当前用户的角色是否包含在允许访问的角色列表中。

##### **4.4. 数据库 (`src/modules/user`, `src/modules/redis`)**

  * **MongoDB:**
      * **连接:** 在 `AppModule` 中，使用 `MongooseModule.forRootAsync` 异步地配置 MongoDB 连接。连接参数（如主机、端口、数据库名、用户名、密码）都是通过 `ConfigService` 从环境变量中动态获取的。
      * **Schema 和 Model:** `src/modules/user/entities/user.entity.ts` 文件中定义了 `User` 的 Mongoose Schema 和模型。
      * **数据操作:** `UserService` 通过 `@InjectModel(User.name)` 注入 `UserModel`，并使用它来进行数据库的增删改查操作。
  * **Redis:**
      * **连接:** `RedisService` 在构造函数中初始化一个 `ioredis` 实例，连接信息同样来自于 `ConfigService`。
      * **服务:** `RedisModule` 提供了 `RedisService`，它封装了一些常用的 Redis 操作，如 `set`, `get`, 和 `del`，并被注册为全局模块，可以在任何地方注入使用。

##### **4.5. 文件上传 (`src/modules/file`)**

  * **控制器:** `FileController` 定义了两个用于文件上传的端点 `/upload` 和 `/upload-files`。
  * **拦截器:**
      * `FileInterceptor` 用于处理单个文件上传。
      * `FilesInterceptor` 用于处理多个文件上传。
  * **文件存储:** 上传的文件默认存储在 `uploads` 目录下。
  * **验证:** `FileValidationPipe` 是一个自定义的管道，用于验证上传文件的大小。

### **5. 如何运行项目**

1.  **安装依赖:**

    ```bash
    npm install
    ```

2.  **配置环境变量:**
    复制 `.env.example` 文件为 `.env`，并根据你的本地环境修改配置，例如数据库连接信息。

    ```bash
    cp .env.example .env
    ```

3.  **启动开发服务器:**

    ```bash
    npm run start:dev
    ```

    应用将在 `http://localhost:3000` 上运行。

4.  **API 文档:**
    访问 `http://localhost:3000/api/v1/swagger` 查看 Swagger API 文档。

## config

### **1. `src/config/configuration.ts`：配置工厂函数**

这个文件导出一个默认函数，它被称为“配置工厂”（Configuration Factory）。它的职责是读取环境变量 (`process.env`) 并将它们组织成一个结构清晰、易于访问的 JavaScript 对象。

**代码分析:**

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
  mongodb: {
    host: process.env.MONGODB_HOST || '127.0.0.1',
    port: parseInt(process.env.MONGODB_PORT) || 27017,
    database: process.env.MONGODB_DB || 'test',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASS || '',
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

  * **结构化:** 它将相关的配置项组合在一起，例如所有数据库相关的配置都在 `mongodb` 对象下。这使得配置项在代码中的调用非常直观，例如 `configService.get('mongodb.host')`。
  * **类型转换:** 它负责将从 `.env` 文件中读取到的字符串类型转换为程序实际需要的类型。例如，`APP_PORT` 被 `parseInt()` 转换为数字类型。
  * **默认值:** 为每个配置项提供了默认值（例如 `process.env.APP_PORT || 3000`）。这保证了即使在没有提供 `.env` 文件的情况下，应用也能以一套默认的开发配置启动，非常有利于快速开始和开发调试。

-----

### **2. `src/config/validation.ts`：环境变量验证**

这个文件使用 `Joi` 库来定义一个验证模式（Schema），用于在应用启动时检查所有必需的环境变量是否存在且格式正确。

**代码分析:**

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

  // MongoDB
  MONGODB_HOST: Joi.string().default('127.0.0.1'),
  // ... 其他数据库和Redis配置
});
```

**关键点:**

  * **强制性规则:** 通过 `.required()` 明确指定了哪些环境变量是必需的，比如 `JWT_SECRET`。如果启动时没有在 `.env` 文件或操作系统环境中提供这个变量，应用会立即报错并退出，从而避免了在运行时出现因配置缺失导致的潜在问题。
  * **类型和格式验证:** Joi 提供了丰富的验证规则。例如，`APP_PORT` 必须是一个数字 (`Joi.number()`)，`NODE_ENV` 必须是 `'development'`, `'production'`, `'test'`, `'online'` 中的一个 (`Joi.string().valid(...)`)。这保证了配置值的正确性。
  * **默认值:** 和 `configuration.ts` 类似，这里也可以设置默认值，作为一种兜底机制。
  * **启动时验证:** 这个验证模式会在应用启动时由 `@nestjs/config` 模块自动执行。这是一种“快速失败”（Fail-fast）的策略，能尽早发现配置错误。

-----

### **3. 如何协同工作**

`configuration.ts` 和 `validation.ts` 在 `app.module.ts` 中被 `@nestjs/config` 模块使用，从而构成一个完整的配置系统。

**`app.module.ts` 中的相关代码:**

```typescript
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema,
        }),
        // ... 其他模块
    ],
})
export class AppModule {}
```

1.  `ConfigModule.forRoot()`: 初始化配置模块。
2.  `isGlobal: true`: 将 `ConfigModule` 注册为全局模块，这样在其他任何模块中都可以直接注入 `ConfigService`，无需在每个模块中单独导入 `ConfigModule`。
3.  `load: [configuration]`: 告诉 `ConfigModule` 使用 `configuration.ts` 中的工厂函数来加载和组织配置。
4.  `validationSchema`: 将 `validation.ts` 中定义的 Joi 验证模式传递给配置模块，用于在启动时进行验证。


## 公共 Filters

### 全局 HTTP 异常过滤器
在 NestJS 中，异常过滤器（Exception Filter）是一个强大的机制，用于捕获未处理的异常，并根据这些异常生成自定义的响应。这个文件就是该机制的一个具体实现。

**代码分析:**

```typescript
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import logger from '../logger';

@Catch(HttpException) // 1. 指定捕获的异常类型
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
    catch(exception: HttpException, host: ArgumentsHost) { // 2. 核心处理方法
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // 3. 获取状态码和错误信息
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionRes = exception.getResponse() as {
            error: string;
            message: string;
        };
        const { error, message } = exceptionRes;

        // 4. 构建统一的错误响应体
        const errorResponse = {
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            message: message || exceptionRes,
            path: request?.url,
            code: 201, // 自定义错误码
            error,
        };

        // 5. 记录错误日志
        logger.error(
            `${request?.method} ${request?.url} ${request.user && request.user._id.toString()} ${JSON.stringify(request.query)}  ${JSON.stringify(request.body)} ${JSON.stringify(errorResponse)}`,
        );
        
        // 6. 发送响应
        response.status(200).json(errorResponse);
    }
}
```

**关键点逐一解析:**

1.  **`@Catch(HttpException)` 装饰器**: 这是此过滤器最核心的部分。它告诉 NestJS，这个过滤器**只负责**捕获类型为 `HttpException` (或其子类) 的异常。这意味着，当你的代码中抛出 `new HttpException('错误信息', 400)`、`new NotFoundException()` 或 `new UnauthorizedException()` 等 NestJS 内置的 HTTP 异常时，都会被这个过滤器捕获。

2.  **`catch` 方法**: 这是 `ExceptionFilter` 接口要求必须实现的方法。当匹配的异常被捕获时，NestJS 会自动调用这个方法，并将异常实例 (`exception`) 和当前的执行上下文 (`host`) 传入。

3.  **获取上下文信息**:

      * `host.switchToHttp()`: 从执行上下文中获取 HTTP 请求相关的所有对象，如 `request` 和 `response`。
      * `exception.getStatus()`: 从 `HttpException` 实例中获取 HTTP 状态码（如 400, 401, 404）。
      * `exception.getResponse()`: 获取抛出异常时附带的详细信息。

4.  **构建统一的错误响应**: 这是该过滤器的主要目的之一。无论内部错误是什么，它都将错误信息包装成一个统一的 JSON 结构返回给前端。这个结构包含了：

      * `timestamp`: 错误发生的时间戳。
      * `message`: 具体的错误提示信息。
      * `path`: 发生错误的请求路径。
      * `code`: 一个自定义的业务错误码（这里硬编码为 `201`，可以根据需要进行调整）。
      * `error`: 错误的简短描述。

5.  **记录详细的错误日志**: 在返回响应之前，该过滤器使用 `winston` 日志记录器 (`logger`) 将详细的错误信息记录到日志文件中。记录的内容非常全面，包括：

      * 请求方法和路径 (`request?.method} ${request?.url}`)。
      * 当前登录的用户 ID (`request.user._id`)，这对于追踪特定用户的错误非常有帮助。
      * 请求的查询参数 (`query`) 和请求体 (`body`)。
      * 最终返回给前端的错误响应体 (`errorResponse`)。
        这为后续的问题排查和系统监控提供了极其宝贵的信息。

6.  **发送响应**:

      * `response.status(200).json(errorResponse)`: **这是一个值得注意的细节**。尽管内部可能发生了 4xx 或 5xx 的错误，但该过滤器最终返回给客户端的 HTTP 状态码是 `200 OK`。真正的业务错误状态是通过响应体中的自定义 `code` 字段来传达的。这是一种常见的实践，旨在简化前端对 HTTP 状态的处理，所有业务层面的成功或失败都通过 `code` 字段来判断。

### **如何集成到应用中**

这个全局异常过滤器在 `src/main.ts` 中通过以下代码被应用到整个项目中：

```typescript
// src/main.ts
async function bootstrap() {
    // ...
    // 拦截处理-错误异常
    app.useGlobalFilters(new HttpExceptionFilter());
    // ...
}
```

`app.useGlobalFilters()` 会将 `HttpExceptionFilter` 注册为一个全局过滤器，确保它能捕获应用中任何地方抛出的 `HttpException`。

## 公共 Guards

Guards 文件夹负责应用的 **授权（Authorization）** 逻辑。在 NestJS 中，守卫（Guard）的核心职责是根据运行时出现的某些条件（例如权限、角色、访问控制列表等）来决定一个给定的请求是否可以被路由处理程序处理。

该项目包含了两个守卫：`auth.guard.ts` 和 `role.guard.ts`。

### **1. `src/common/guards/auth.guard.ts`：JWT 认证守卫**

这个守卫是整个应用认证系统的核心。它的作用是保护需要用户登录后才能访问的接口。如果请求没有提供有效JWT（JSON Web Token），该守卫会拒绝访问。

**代码分析:**

```typescript
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userSerivce: UserService,
        private configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. 从请求头中提取 Token
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            // 2. 验证 Token
            const { _id } = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.secret'),
            });

            // 3. 从数据库查找用户
            const user = await this.userSerivce.findOne(_id);
            
            // 4. 将用户信息附加到请求对象上
            request['user'] = user;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
```

**工作流程:**

1.  **提取 Token**: `extractTokenFromHeader` 方法从 HTTP 请求的 `Authorization` 头中解析出 `Bearer Token`。
2.  **验证 Token**: 使用 `jwtService.verifyAsync` 方法和从配置中获取的 `JWT_SECRET` 来验证 Token 的有效性。如果 Token 无效或已过期，会抛出异常。
3.  **获取用户**: Token 验证成功后，会从中解析出用户的 `_id`。然后调用 `UserService` 的 `findOne` 方法从数据库中查询完整的用户信息。
4.  **挂载用户**: 将查询到的用户信息（不包含密码）挂载到 `request` 对象上，赋值给 `request['user']`。这样做的好处是，后续的处理器（包括其他守卫、控制器等）可以直接从请求对象中获取当前登录的用户信息。
5.  **处理异常**: 如果在任何步骤中出现问题（如 Token 不存在、验证失败），则会抛出 `UnauthorizedException`，NestJS 会中断请求并返回一个 `401 Unauthorized` 错误。

#### **使用示例 (`src/modules/user/user.controller.ts`)**

`AuthGuard` 通过 `@UseGuards()` 装饰器应用在需要保护的路由上。

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('user')
export class UserController {
    // ...

    @UseGuards(AuthGuard) // <--- 在这里应用守卫
    @Get('info')
    async getInfo(@Request() req) {
        // 因为 AuthGuard 已经执行过，所以这里可以直接从 req.user 获取用户信息
        console.log(req.user);
        return req.user;
    }
}
```

在这个例子中，任何对 `GET /api/user/info` 的请求都会首先被 `AuthGuard` 拦截。只有在请求头中包含了有效的 `Bearer Token` 时，`getInfo` 方法才会被执行。

-----

### **2. `src/common/guards/role.guard.ts`：角色授权守卫**

这个守卫用于实现更细粒度的访问控制，即基于角色的访问控制（RBAC）。它检查当前登录的用户是否具有访问特定资源所必需的角色。

**代码分析:**

```typescript
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';

export function RoleGuard(roles: string[] | string) { // 1. 这是一个工厂函数
    @Injectable()
    class RoleGuardClass implements CanActivate {
        async canActivate(context: ExecutionContext) {
            // 2. 假设 AuthGuard 已运行，获取 user 对象
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const userRoles = user.roles;
            
            if (typeof roles === 'string') {
                roles = [roles];
            }

            // 3. 检查用户角色是否满足要求
            const res = roles.some(role => userRoles.includes(role));
            if (!res) {
                throw new UnauthorizedException('您没有权限访问');
            }
            return true;
        }
    }

    return RoleGuardClass; // 4. 返回守卫类
}
```

**工作流程:**

1.  **工厂函数**: `RoleGuard` 本身不是一个守卫类，而是一个接收 `roles` 参数的工厂函数。`roles` 参数定义了允许访问该路由的角色列表。
2.  **依赖 `AuthGuard`**: 这个守卫的设计**假设 `AuthGuard` 已经先于它执行**，因此它可以安全地从 `request.user` 中获取用户信息和角色列表。
3.  **角色检查**: `canActivate` 方法的核心逻辑是检查 `user.roles` 数组中是否至少包含一个 `RoleGuard` 参数中指定的角色。
4.  **返回守卫**: 工厂函数最后返回一个真正的守卫类 `RoleGuardClass`。

#### **使用示例 (`README.md`)**

`RoleGuard` 和 `AuthGuard` 通常会一起使用。NestJS 会按照装饰器从下到上的顺序执行守卫。

```typescript
import { UseGuards, Post, Request } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';

// ...

// 示例：这个接口只允许 'admin' 角色的用户访问
@UseGuards(RoleGuard(['admin'])) // <-- 2. RoleGuard 在 AuthGuard 之后执行
@UseGuards(AuthGuard)         // <-- 1. AuthGuard 首先执行，进行认证并挂载 user
@Post('delete-user')
async deleteUser(@Request() req) {
    // 只有 admin 用户才能执行到这里
    // req.user 对象在这里依然可用
    return { message: '用户已删除' };
}

// 示例：允许多个角色
@UseGuards(RoleGuard(['admin', 'super']))
@UseGuards(AuthGuard)
@Get('dashboard-data')
async getDashboardData() {
    // 只有 admin 或 super 角色的用户才能访问
    return { data: '一些敏感数据' };
}
```

## 公共 Interceptor


### **1. 统一响应格式拦截器**

这个拦截器的主要职责是确保所有成功的 API 请求都返回一个统一的、结构化的 JSON 对象。

**代码分析:**

```typescript
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const transformValue = (data: any) => {
    return {
        data,
        code: 0,
        message: '请求成功',
    }
}

// 处理统一成功返回值
@Injectable()
export class TransformReturnInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // ... (注释掉的代码可以用于排除某些不需要格式化的接口)

        return next.handle().pipe(map(transformValue)) // 1. 核心逻辑
    }
}
```

**关键点解析:**

1.  **`intercept` 方法**: 这是所有拦截器必须实现的方法。`next.handle()` 返回一个 `Observable`，它代表了路由处理程序（即你的 Controller 方法）的响应流。
2.  **RxJS `map` 操作符**: 这里的核心是 `pipe(map(transformValue))`。`map` 操作符会获取从 Controller 方法返回的数据（`data`），然后将其传入 `transformValue` 函数进行处理。
3.  **`transformValue` 函数**: 这个函数接收原始数据，并将其包装在一个新的对象中，添加了 `code: 0` 和 `message: '请求成功'` 字段。`code: 0` 是一种常见的约定，用以表示业务操作成功。

#### **效果示例**

**没有**这个拦截器时，如果一个 Controller 方法返回一个用户对象：

```typescript
// in user.controller.ts
@Get('info')
getInfo() {
    return { username: 'testuser', roles: ['user'] };
}
```

客户端收到的响应会是：

```json
{
    "username": "testuser",
    "roles": ["user"]
}
```

**有了**这个拦截器后，同样的 Controller 方法返回的数据会被包装，客户端收到的响应会变成：

```json
{
    "data": {
        "username": "testuser",
        "roles": ["user"]
    },
    "code": 0,
    "message": "请求成功"
}
```

这种统一的格式极大地简化了前端的处理逻辑。

-----

### **2. 请求日志拦截器**

这个拦截器的作用是记录每一个成功处理的请求的详细信息，用于后续的审计和调试。

**代码分析:**

```typescript
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import logger from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        return next
            .handle()
            .pipe(
                tap(() => { // 1. 核心逻辑
                    const { method, path, user, query, body } = request;
                    // 2. 记录日志
                    logger.info(`${method} ${path} ${user && (user as any)._id.toString()} ${JSON.stringify(query)}  ${JSON.stringify(body)}`);
                }),
            );
    }
}
```

**关键点解析:**

1.  **RxJS `tap` 操作符**: 与 `map` 不同，`tap` 操作符允许你执行一些“副作用”（side effect），但**不会修改**流中的数据。在这里，它的副作用就是记录日志。`tap` 在 `Observable` 成功完成时执行，这意味着它会在 Controller 方法成功返回数据之后执行。
2.  **日志内容**: 它记录了请求的多个关键信息，包括：
      * **HTTP 方法** (`method`)
      * **请求路径** (`path`)
      * **用户 ID** (`user._id`)，前提是 `AuthGuard` 已经运行并将 `user` 对象附加到了请求上
      * **查询参数** (`query`)
      * **请求体** (`body`)

#### **示例日志输出**

假设一个用户（ID为 `60f...`）请求 `GET /api/user/info?source=web`，这个拦截器会在 `logs/` 目录下生成一条类似这样的日志：

```json
{"level":"info","message":"GET /api/user/info 60f... {\"source\":\"web\"}  {}","timestamp":"YYYY-MM-DD HH:mm:ss"}
```

-----

### **集成与执行顺序**

这两个拦截器都在 `src/main.ts` 中被注册为全局拦截器。

```typescript
// src/main.ts
// ...
app.useGlobalInterceptors(new TransformReturnInterceptor());
app.useGlobalInterceptors(new LoggingInterceptor());
// ...
```

NestJS 会按照注册的顺序执行拦截器。当一个请求进来时：

1.  请求进入 `TransformReturnInterceptor` 的 `intercept` 方法。
2.  请求进入 `LoggingInterceptor` 的 `intercept` 方法。
3.  请求被路由到 Controller 的处理方法。
4.  Controller 方法返回数据。
5.  响应流首先经过 `LoggingInterceptor`，`tap` 操作符被触发，记录日志。
6.  响应流接着经过 `TransformReturnInterceptor`，`map` 操作符被触发，将数据包装成统一格式。
7.  最终格式化的响应被发送给客户端。

## 公共 Pipes

在 NestJS 中，管道（Pipe）是一种非常有用的功能，它通常用于对路由处理函数的输入参数进行**转换（Transformation）或验证（Validation）**。当请求到达时，管道会在控制器方法执行之前对参数进行处理。

这个项目中 `common/pipes` 文件夹里的 `validation.pipe.ts` 就是一个典型的验证管道。

-----

### **`src/common/pipes/validation.pipe.ts`：全局验证管道**

这个管道的核心职责是**自动验证**所有进入 Controller 的请求数据（特别是请求体 `body`、查询参数 `query`、路径参数 `params`），确保它们符合预定义的规则。它主要依赖 `class-validator` 和 `class-transformer` 这两个库来完成工作。

**代码分析:**

```typescript
import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform, Type, } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        // 1. 获取参数的元类型
        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value; // 2. 如果不需要验证，则直接返回原始值
        }
        
        // 3. 将普通的 JavaScript 对象转换为类的实例
        const object = plainToClass(metatype, value);
        
        // 4. 使用 class-validator 进行验证
        const errors = await validate(object);
        
        if (errors.length > 0) {
            // 5. 如果有错误，则提取第一条错误信息并抛出异常
            const errObj = Object.values(errors[0].constraints)[0];
            throw new HttpException(
                { message: '请求参数验证失败 ', error: errObj },
                HttpStatus.BAD_REQUEST,
            );
        }
        
        // 6. 如果验证通过，返回转换后的对象实例
        return value;
    }

    private toValidate(metatype: Type<any>): boolean {
        const types = [String, Boolean, Number, Array, Object];
        // 如果 metatype 是 JS 内置类型，则不进行验证
        return !types.find(type => metatype === type);
    }
}
```

**关键点逐一解析:**

1.  **`metatype`**: 这是传入参数的类型信息。对于 `@Body()`, `@Query()`, `@Param()` 等装饰器，如果指定了具体的 DTO (Data Transfer Object) 类，`metatype` 就会是这个类的构造函数。

2.  **`toValidate` 检查**: 这个私有方法用于判断是否需要进行验证。它排除了 JavaScript 的内置基本类型（如 `String`, `Number`），因为这些类型通常不需要复杂的验证。只有当参数是一个自定义的类（DTO）时，才继续执行验证。

3.  **`plainToClass` (来自 `class-transformer`)**: 这是非常关键的一步。从网络请求中接收到的 `body` 或 `query` 只是普通的、没有类型的 JavaScript 对象。`plainToClass` 会将这个普通对象转换为 `metatype`（也就是你的 DTO 类）的一个实例。只有转换成类的实例后，`class-validator` 才能识别和应用你在 DTO 类上定义的验证装饰器。

4.  **`validate` (来自 `class-validator`)**: 这个函数会检查 `object` 实例上的所有 `class-validator` 装饰器（如 `@IsString`, `@IsNotEmpty`, `@Length` 等），并返回一个包含所有验证错误的数组。如果数组为空，说明验证通过。

5.  **抛出异常**: 如果 `errors` 数组不为空，说明验证失败。管道会提取第一个错误的约束信息（例如，“password must be longer than or equal to 6 characters”），然后将其包装在一个 `HttpException` 中抛出，状态码为 `400 Bad Request`。这个异常随后会被我们之前分析过的 `HttpExceptionFilter` 捕获，并以统一的 JSON 格式返回给前端。

6.  **返回 `value`**: 如果验证通过，管道会将原始的 `value`（现在已经是一个类的实例）传递给路由处理函数。

### **如何集成到应用中**

这个管道在 `src/main.ts` 中被注册为全局管道。

```typescript
// src/main.ts
// ...
// 使用管道验证数据
app.useGlobalPipes(new ValidationPipe());
// ...
```

这意味着**应用中所有**的路由处理函数都会自动应用这个验证管道。

### **使用示例**

让我们结合 `CreateUserDto` 和 `UserController` 来看一个完整的例子。

**1. 定义 DTO (`src/modules/user/dto/create-user.dto.ts`):**

这里使用 `class-validator` 的装饰器来定义验证规则。

```typescript
import { IsNotEmpty, IsString, Length } from 'class-validator';
// ...
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20) // 密码长度必须在 6 到 20 之间
    password: string;
}
```

**2. 在 Controller 中使用 DTO (`src/modules/user/user.controller.ts`):**

```typescript
@Controller('user')
export class UserController {
    // ...
    @Post('register')
    register(@Body() createUserDto: CreateUserDto) { // <-- 管道作用于此
        return this.userService.create(createUserDto);
    }
}
```

**场景分析:**

  * **场景一：成功的请求**

    客户端发送 `POST /api/user/register` 请求，请求体为：

    ```json
    {
        "username": "testuser",
        "password": "password123"
    }
    ```

    1.  `ValidationPipe` 启动。
    2.  `toValidate` 检查发现 `createUserDto` 是一个 `CreateUserDto` 类，需要验证。
    3.  `plainToClass` 将 JSON 对象转换为 `CreateUserDto` 的实例。
    4.  `validate` 函数检查该实例，`username` 和 `password` 都符合 `@IsString`, `@IsNotEmpty`, `@Length(6, 20)` 的规则。
    5.  `errors` 数组为空，验证通过。
    6.  `createUserDto` 对象被传递给 `register` 方法，业务逻辑继续执行。

  * **场景二：失败的请求**

    客户端发送 `POST /api/user/register` 请求，但密码太短：

    ```json
    {
        "username": "testuser",
        "password": "123" 
    }
    ```

    1.  `ValidationPipe` 启动，前三步同上。
    2.  `validate` 函数检查实例，发现 `password` 字段不满足 `@Length(6, 20)` 规则。
    3.  `errors` 数组不为空。管道提取出错误信息（例如 "password must be longer than or equal to 6 characters"）。
    4.  管道抛出一个 `HttpException`，状态码为 400。
    5.  请求被中断，`register` 方法**不会被执行**。
    6.  `HttpExceptionFilter` 捕获该异常，并向客户端返回如下格式的响应：
        ```json
        {
            "timestamp": "...",
            "message": "请求参数验证失败",
            "path": "/api/user/register",
            "code": 201,
            "error": "password must be longer than or equal to 6 characters"
        }
        ```
## 默认模块 auth

`auth` 模块是整个应用的核心安全模块，它负责处理用户的**认证（Authentication）**，即“用户登录”和“令牌管理”。它与我们之前分析的 `AuthGuard` 和 `RoleGuard` 紧密协作，构成了完整的认证授权流程。


### **1. `src/modules/auth/auth.module.ts`：认证模块**

这个文件定义了 `AuthModule`，它将所有与认证相关的组件（Controller, Service, Strategy）组织在一起。

**代码分析:**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        // 1. 导入 User 模型，使得 AuthService 可以查询用户数据
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        // 2. 导入 UserModule，以便 AuthService 可以复用 UserService 的功能
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy], // 3. 注册服务和策略
})
export class AuthModule {}
```

**关键点:**

1.  **`MongooseModule.forFeature`**: 导入 `User` 模型，这使得 `AuthService` 可以通过依赖注入的方式直接操作 `users` 集合（查询用户信息以验证登录）。
2.  **`UserModule`**: 导入 `UserModule`。虽然这里 `AuthService` 没有直接注入 `UserService`，但 `UserModule` 导出了 `UserService`，这是一种模块间依赖关系的体现。
3.  **`providers`**:
      * `AuthService`: 包含了登录和创建 Token 的核心业务逻辑。
      * `JwtStrategy`: 包含了验证 JWT 载荷（payload）的逻辑，供 `passport-jwt` 模块使用。

-----

### **2. `src/modules/auth/auth.service.ts`：认证服务**

这是认证模块的业务逻辑核心，处理用户登录验证和 JWT 的生成。

**代码分析:**

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService, // 1. 注入 JWT 服务
        @InjectModel(User.name) private userModel: Model<UserDocument>, // 2. 注入 User 模型
    ) {}

    async login(createUserDto: CreateUserDto) {
        const { username, password } = createUserDto;
        // 3. 查找用户
        const user = await this.userModel.findOne({ username }).lean();
        if (!user) {
            throw new HttpException({ message: '用户不存在' }, 201);
        }
        // 4. 比较密码
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new HttpException({ message: '密码错误' }, 201);
        }
        // 5. 返回用户信息用于生成 Token
        return {
            _id: user._id.toString(),
            username: user.username,
            roles: user.roles,
        };
    }

    async createToken(user: any): Promise<string> {
        // 6. 使用 jwtService 生成 Token
        return this.jwtService.sign(user);
    }

    async logout(): Promise<void> {
        // 7. 服务端登出逻辑（通常为空）
        return;
    }
}
```

**关键点:**

1.  **注入 `JwtService`**: 这个服务由 `@nestjs/jwt` 模块提供，包含了 `sign` (签名) 和 `verify` (验证) 等处理 JWT 的核心方法。
2.  **注入 `userModel`**: 用于直接访问 MongoDB 的 `users` 集合。
3.  **查找用户**: 在 `login` 方法中，首先根据用户名在数据库中查找用户。
4.  **密码验证**: 使用 `bcrypt.compareSync` 来比较用户输入的明文密码和数据库中存储的哈希密码。这是保证密码安全的关键步骤。
5.  **返回用户信息**: 验证成功后，返回一个不包含敏感信息（如密码）的用户对象。这个对象将作为 JWT 的载荷（Payload）。
6.  **创建 Token**: `createToken` 方法接收用户信息对象，并调用 `jwtService.sign` 来生成一个 JWT 字符串。
7.  **登出**: `logout` 方法是空的，这符合 JWT 的无状态特性。JWT 的登出操作通常在客户端完成（例如，删除本地存储的 Token）。

-----

### **3. `src/modules/auth/auth.controller.ts`：认证控制器**

这个控制器暴露了与认证相关的 HTTP 端点，主要是登录和登出。

**代码分析:**

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() createUserDto: CreateUserDto) {
        // 1. 调用 AuthService 的 login 方法进行验证
        const user = await this.authService.login(createUserDto);
        // 2. 验证成功后，创建 Token
        const token = await this.authService.createToken(user);
        // 3. 返回 Token 和用户信息给客户端
        return {
            accessToken: token,
            id: user._id,
            username: user.username,
            roles: user.roles,
        };
    }

    @Post('logout')
    async logout() {
        await this.authService.logout();
        return {
            message: '登出成功，请在客户端删除本地存储的 token',
        };
    }
}
```

**关键点:**

1.  **`@Post('login')`**: 定义了处理 `POST /api/auth/login` 请求的方法。
2.  **`@Body()`**: 使用 `@Body()` 装饰器来获取请求体中的数据，并期望它符合 `CreateUserDto` 的结构。`ValidationPipe` 会在这里自动进行验证。
3.  **返回 `accessToken`**: 登录成功后，将生成的 JWT 以 `accessToken` 的字段名返回给客户端。客户端在后续的请求中需要将此 Token 放在 `Authorization` 请求头中。

-----

### **4. `src/modules/auth/jwt.strategy.ts`：JWT 策略**

这个文件定义了 `passport-jwt` 的策略，它描述了如何从请求中提取 JWT、如何验证它，以及如何根据验证后的载荷生成 `user` 对象。

**代码分析:**

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            // 1. 从 Authorization 请求头中提取 Bearer Token
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 2. 不忽略 Token 过期
            ignoreExpiration: false,
            // 3. 使用配置服务获取密钥
            secretOrKey: configService.get('jwt.secret'),
        });
    }

    // 4. 验证通过后的回调
    async validate(payload: any) {
        const { username, _id } = payload;
        return { username, _id };
    }
}
```

**关键点:**

1.  **`jwtFromRequest`**: 指定了从哪里提取 JWT。`fromAuthHeaderAsBearerToken()` 是最常用的方式。
2.  **`ignoreExpiration: false`**: 确保过期的 Token 会被拒绝。
3.  **`secretOrKey`**: 提供了用于验证 Token 签名的密钥。这里通过注入 `ConfigService` 来动态、安全地获取密钥。
4.  **`validate` 方法**: 这是 `passport-jwt` 策略的核心。当 Token 签名被成功验证后，Passport 会调用这个方法，并将解码后的载荷（Payload）作为参数传入。此方法返回的对象将被 Passport 附加到 `request.user` 上。在这个项目中，它返回了一个包含 `username` 和 `_id` 的精简对象，供后续的守卫和控制器使用。

### **总结与流程串联**

`auth` 模块的各个部分协同工作，构成了一个完整的认证流程：

1.  **用户登录**:

      * 客户端向 `POST /api/auth/login` 发送用户名和密码。
      * `AuthController` 接收请求，并调用 `AuthService.login()`。
      * `AuthService` 查询数据库，使用 `bcrypt` 比较密码。
      * 验证成功后，`AuthService` 调用 `createToken()`，使用 `JwtService` 生成一个包含用户ID、用户名和角色的 JWT。
      * `AuthController` 将 JWT 和用户信息返回给客户端。

2.  **访问受保护资源**:

      * 客户端向一个受 `@UseGuards(AuthGuard)` 保护的接口（如 `GET /api/user/info`）发起请求，并在 `Authorization` 头中携带 `Bearer <JWT>`。
      * `AuthGuard` 拦截请求，从请求头中提取 Token。
      * `AuthGuard` 调用 `JwtService.verifyAsync()` 来验证 Token。这个过程内部会使用 `JwtStrategy` 中配置的密钥。
      * 验证成功后，`AuthGuard` 从 Token 载荷中获取 `_id`，查询数据库得到完整的 `user` 对象，并将其挂载到 `request.user`。
      * 请求继续被处理，此时控制器中的 `req.user` 就包含了当前登录用户的信息。

## 默认模块 user

这个模块是应用中与用户相关的核心业务模块，它负责管理用户数据，包括用户的创建、查询以及定义用户的数据结构。它与 `auth` 模块紧密相连，为认证和授权提供了基础数据支持。

### **1. `src/modules/user/entities/user.entity.ts`：用户实体/模型**

这个文件定义了用户数据在 MongoDB 中存储的结构（Schema）。

**代码分析:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Role { // 1. 定义角色枚举
    SUPER = 'super',
    ADMIN = 'admin',
    USER = 'user',
}

@Schema({ timestamps: true }) // 2. 定义 Mongoose Schema
export class User {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        type: [String],
        enum: [Role.SUPER, Role.ADMIN, Role.USER],
        default: [Role.USER], // 3. 默认角色为 'user'
        required: true,
    })
    roles: Role[];
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
```

**关键点:**

1.  **`Role` 枚举**: 定义了系统中存在的三种角色：`super` (超级管理员), `admin` (管理员), 和 `user` (普通用户)。使用枚举可以提高代码的可读性和可维护性。
2.  **`@Schema({ timestamps: true })`**: 这个装饰器告诉 Mongoose，当创建或更新文档时，自动添加 `createdAt` 和 `updatedAt` 两个时间戳字段。
3.  **`@Prop` 装饰器**: 用于定义 Schema 中的字段。
      * `username` 和 `password` 都是必需的字符串。
      * `roles` 是一个字符串数组，其值必须是 `Role` 枚举中定义的值。它的默认值是 `[Role.USER]`，意味着新注册的用户默认为普通用户角色。

-----

### **2. `src/modules/user/dto/create-user.dto.ts` 和 `update-user.dto.ts`：数据传输对象**

DTO (Data Transfer Object) 用于定义接口的输入/输出数据结构，并配合 `ValidationPipe` 进行数据验证。

  * **`create-user.dto.ts`**: 定义了创建用户（注册）时需要传递的数据结构和验证规则。
    ```typescript
    import { IsNotEmpty, IsString, Length } from 'class-validator';
    // ...
    export class CreateUserDto {
        @IsString()
        @IsNotEmpty()
        username: string;

        @IsString()
        @IsNotEmpty()
        @Length(6, 20)
        password: string;
    }
    ```
  * **`update-user.dto.ts`**: 定义了更新用户时的数据结构。它使用了 `@nestjs/mapped-types` 的 `PartialType`，这意味着 `UpdateUserDto` 继承了 `CreateUserDto` 的所有属性，但将它们都变成了可选的。

-----

### **3. `src/modules/user/user.service.ts`：用户服务**

这是用户模块的业务逻辑层，负责与数据库进行交互和处理数据。

**代码分析:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        // 1. 生成盐并哈希密码
        const salt = await bcrypt.genSalt(10);
        const data = {
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, salt),
        };
        // 2. 创建用户
        return this.userModel.create(data);
    }

    findOne(id: string): Promise<UserDocument> {
        // 3. 根据 ID 查找用户，并排除密码字段
        return this.userModel.findById(id).select('-password').exec();
    }
}
```

**关键点:**

1.  **密码哈希**: 在 `create` 方法中，并没有直接存储用户提交的明文密码。而是使用 `bcryptjs` 库，先生成一个随机的“盐”（salt），然后将密码和盐结合进行哈希运算。这是一种标准的、安全的密码存储方式，可以有效防止即使数据库泄露，用户的原始密码也不会暴露。
2.  **创建用户**: 调用 `this.userModel.create(data)` 将处理过的数据存入 MongoDB。
3.  **查询用户**: `findOne` 方法用于根据用户 ID 查询用户信息。值得注意的是，它使用了 `.select('-password')`，这会确保在查询结果中**排除** `password` 字段，避免将密码哈希值泄露给不必要的业务逻辑中。

-----

### **4. `src/modules/user/user.controller.ts`：用户控制器**

控制器负责处理与用户相关的 HTTP 请求，并调用 `UserService` 来完成具体的业务逻辑。

**代码分析:**

```typescript
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(AuthGuard) // 1. 应用认证守卫
    @Get('info')
    async getInfo(@Request() req) {
        console.log(req.user);
        return req.user;
    }

    @Post('register') // 2. 用户注册接口
    register(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }
}
```

**关键点:**

1.  **`@Get('info')`**: 这个端点用于获取当前登录用户的信息。它被 `@UseGuards(AuthGuard)` 保护，意味着只有携带有效 Token 的用户才能访问。它直接返回 `req.user`，这个 `user` 对象是由 `AuthGuard` 在验证 Token 后附加到 `request` 上的。
2.  **`@Post('register')`**: 这个端点用于用户注册。它接收一个 `CreateUserDto` 类型的请求体，`ValidationPipe` 会自动验证这个 DTO。然后，它调用 `userService.create` 方法来创建新用户。

-----

### **5. `src/modules/user/user.module.ts`：用户模块**

最后，模块文件将以上所有部分组合在一起。

```typescript
@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [UserController],
    providers: [UserService, AuthGuard], // 1. 提供 AuthGuard
    exports: [UserService], // 2. 导出 UserService
})
export class UserModule {}
```

**关键点:**

1.  **`providers`**: 在这里提供了 `UserService` 和 `AuthGuard`。值得注意的是，`AuthGuard` 也在这里被提供，因为它依赖于 `UserService`。
2.  **`exports`**: `UserModule` 导出了 `UserService`。这使得其他导入了 `UserModule` 的模块（例如 `AuthModule`）可以直接注入和使用 `UserService`，这是 NestJS 模块化系统实现依赖共享的关键。

### **总结**

`user` 模块是一个功能内聚的单元，它完整地封装了用户管理的全部逻辑：

  * **定义了数据模型** (`user.entity.ts`) 和 **接口数据结构** (`dto/`)。
  * **处理核心业务逻辑** (`user.service.ts`)，特别是像密码加密这样的安全操作。
  * **暴露安全的 API 端点** (`user.controller.ts`)，并通过守卫进行保护。
  * **封装并导出服务** (`user.module.ts`)，供其他模块复用。

## 默认模块 file

### **文件模块 (`src/modules/file`) 详解**

`file` 模块封装了所有与文件上传相关的功能，提供了单文件和多文件上传的接口，并包含了文件存储、信息处理和验证的逻辑。

-----

#### **1. `file.module.ts`：文件模块定义**

这是模块的入口文件，它将控制器 (`FileController`) 和服务 (`FileService`) 组装在一起，构成一个完整的功能单元。

**代码分析:**

```typescript
import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
    controllers: [FileController],
    providers: [FileService],
})
export class FileModule {}
```

  - **`@Module({})`**: NestJS 的模块装饰器。
  - **`controllers: [FileController]`**: 声明该模块的控制器是 `FileController`，负责处理路由和 HTTP 请求。
  - **`providers: [FileService]`**: 注册 `FileService` 作为提供者，这意味着它可以在 `FileController` 或其他服务中被依赖注入。

-----

#### **2. `file.controller.ts`：文件控制器**

控制器是处理文件上传请求的核心，它定义了 API 端点、配置了文件处理中间件，并集成了 Swagger 文档。

**代码分析:**

```typescript
import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
// ... 其他导入

@ApiTags('文件管理')
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    // ... getStorageConfig() 方法 ...

    @UseInterceptors(FileInterceptor('file', { storage: ... }))
    @Post('upload')
    // ... Swagger 装饰器 ...
    uploadFile(@UploadedFile(FileValidationPipe) file: Express.Multer.File): FileInfoDto {
        return this.fileService.processUploadedFile(file);
    }

    @UseInterceptors(FilesInterceptor('files', 3, { storage: ... }))
    @Post('upload-files')
    // ... Swagger 装饰器 ...
    uploadFiles(@UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>): FileInfoDto[] {
        return this.fileService.processUploadedFiles(files);
    }
}
```

**关键点解析:**

1.  **路由定义**:

      * `@Controller('file')`: 将该控制器下的所有路由都挂载在 `/api/file` 路径下。
      * `@Post('upload')`: 定义处理单文件上传的端点，路径为 `POST /api/file/upload`。
      * `@Post('upload-files')`: 定义处理多文件上传的端点，路径为 `POST /api/file/upload-files`。

2.  **文件处理拦截器 (`@UseInterceptors`)**:

      * `FileInterceptor('file', ...)`: 用于处理单个文件上传。第一个参数 `'file'` 必须与表单数据中的字段名 (`<input type="file" name="file">`) 匹配。
      * `FilesInterceptor('files', 3, ...)`: 用于处理多个文件上传。第一个参数 `'files'` 对应表单字段名，第二个参数 `3` 表示一次最多允许上传 3 个文件。

3.  **文件存储策略 (`diskStorage`)**:

      * `destination`: 这个函数动态地创建存储目录。它会根据当前日期（例如 `20250823`）在 `uploads/` 目录下创建一个子文件夹，实现了按日期归档的功能。
      * `filename`: 这个函数生成一个唯一的文件名，以避免文件名冲突。它使用 `uuidv4()` 生成一个 UUID，并拼接上原始文件的扩展名。

4.  **参数装饰器与管道**:

      * `@UploadedFile()`: 从请求中提取单个上传的文件对象。
      * `@UploadedFiles()`: 从请求中提取多个上传的文件对象数组。
      * `FileValidationPipe`: 这是一个自定义管道，会在文件传递给处理方法之前对文件进行验证（详见下文）。

5.  **Swagger 文档**:

      * `@ApiTags('文件管理')`: 在 Swagger UI 中为这组接口创建一个分类。
      * `@ApiOperation`, `@ApiConsumes`, `@ApiBody`: 详细描述了接口的功能、请求的内容类型（`multipart/form-data`）以及请求体的结构，使得 API 文档清晰易懂。

-----

#### **3. `file.service.ts`：文件服务**

服务层负责处理具体的业务逻辑，它将 `multer` 提供的原始文件对象转换为结构化的、包含更多有用信息的 DTO 对象。

**代码分析:**

```typescript
import { Injectable } from '@nestjs/common';
import { FileInfoDto } from './dto/file-info.dto';
import * as path from 'path';

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
    // ... processUploadedFiles 方法 ...
}
```

**关键点解析:**

1.  **数据处理**: `processUploadedFile` 方法接收一个 `Express.Multer.File` 类型的对象。
2.  **信息提取与丰富**:
      * 它使用 `path.extname()` 提取文件扩展名。
      * 它从环境变量中读取 `APP_BASE_URL` 来构建一个可公开访问的文件 URL。
      * 它将 Windows 风格的路径分隔符 `\` 替换为 `/`，以确保 URL 的通用性。
3.  **返回 DTO**: 该方法最后返回一个 `FileInfoDto` 对象，其中包含了文件名、原始文件名、MIME 类型、大小、存储路径、扩展名、上传时间和访问 URL。

-----

#### **4. `filevalidation.pipe.ts`：文件验证管道**

这是一个自定义管道，专门用于验证上传的文件是否符合预设的规则。

**代码分析:**

```typescript
import { PipeTransform, Injectable, HttpException, HttpStatus } from '@nestjs/common';

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

**关键点解析:**

1.  **`PipeTransform` 接口**: 实现了这个接口的 `transform` 方法，NestJS 会在请求参数传递给路由处理器之前调用它。
2.  **验证逻辑**: `transform` 方法检查传入的 `file` 对象的 `size` 属性。如果文件大小超过配置的大小（默认 10MB），它会抛出一个 `HttpException`。
3.  **异常处理**: 抛出的异常会被全局的 `HttpExceptionFilter` 捕获，并以统一的 JSON 格式返回给客户端。

-----

#### **5. `dto/` 目录：数据传输对象**

DTO 文件定义了 API 响应的数据结构，并利用 `@nestjs/swagger` 的 `@ApiProperty` 装饰器为 Swagger 文档提供详细的字段说明。

  * **`file-info.dto.ts`**: 定义了单个文件信息的结构，包含了文件名、路径、大小、URL 等字段。
  * **`files-info.dto.ts`**: 定义了多文件上传时，响应体的结构，它包含一个 `FileInfoDto` 类型的数组。

### **总结与工作流程**

`file` 模块的工作流程如下：

1.  客户端发起一个 `multipart/form-data` 请求到 `POST /api/file/upload` 或 `POST /api/file/upload-files`。
2.  NestJS 的 `FileInterceptor` 或 `FilesInterceptor` 拦截该请求。
3.  `diskStorage` 配置被执行：
      * 根据当前日期创建 `uploads/YYYYMMDD` 目录。
      * 生成一个 UUID 作为新的文件名，并保留原始扩展名。
      * 文件被保存到目标目录。
4.  `FileValidationPipe` 管道被触发，检查文件大小是否合规。如果不合规，则抛出异常，请求中断。
5.  如果验证通过，`@UploadedFile()` 或 `@UploadedFiles()` 装饰器将处理后的文件对象注入到控制器方法中。
6.  `FileController` 调用 `FileService` 的相应方法 (`processUploadedFile` 或 `processUploadedFiles`)。
7.  `FileService` 将原始文件对象处理成 `FileInfoDto`，添加上访问 URL 和其他元数据。
8.  `FileController` 将 `FileInfoDto` (或其数组) 作为响应返回。
9.  最后，全局的 `TransformReturnInterceptor` 会将这个响应包装成 `{ "data": ..., "code": 0, "message": "..." }` 的标准格式返回给客户端。