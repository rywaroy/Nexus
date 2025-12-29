## 简介

### **1. 项目概述**

Nexus 是一个基于 NestJS 框架构建的后端应用程序。它提供了一套完整的功能，包括：

  * **用户认证与授权:** 基于 JWT (JSON Web Token) 的用户认证机制，以及基于角色的访问控制 (RBAC)。
  * **多数据库支持:** 使用 Prisma ORM 支持 MySQL、PostgreSQL 和 MongoDB，可根据部署环境灵活选择。
  * **缓存系统:** 集成 Redis 用于缓存。
  * **文件上传:** 支持单个和多个文件上传，并包含文件大小验证。支持本地存储和阿里云 OSS。
  * **配置管理:** 采用现代化的配置系统，通过环境变量进行灵活配置，并使用 Joi 进行验证。
  * **日志系统:** 使用 Winston 进行日志记录，包括控制台输出和每日轮换的日志文件。
  * **API 文档:** 集成 Swagger (OpenAPI) 自动生成和展示 API 文档。
  * **代码质量:** 使用 ESLint 和 Prettier 来确保代码风格的统一和质量。
  * **模块化结构:** 项目代码按功能模块进行组织，结构清晰，易于维护和扩展。

### **2. 技术栈**

  * **框架:** NestJS (`@nestjs/core`)
  * **语言:** TypeScript
  * **ORM:** Prisma (支持 MySQL、PostgreSQL、MongoDB)
  * **缓存:** Redis (使用 `ioredis` 连接)
  * **认证:** JWT (`@nestjs/jwt`, `passport`, `passport-jwt`)
  * **配置:** `@nestjs/config`, `joi`
  * **API 文档:** `@nestjs/swagger`
  * **代码规范:** ESLint, Prettier
  * **测试:** Jest, Supertest

### **3. 项目结构**

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

### **路径别名**

项目配置了 TypeScript 路径别名，使用 `@/*` 指向 `src/*` 目录，简化跨目录导入：

```typescript
// 之前
import { AuthGuard } from '../../../common/guards/auth.guard';

// 现在
import { AuthGuard } from '@/common/guards/auth.guard';
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

##### **4.4. 数据库 (`src/common/modules/prisma`)**

  * **Prisma ORM:**
      * **多数据库支持:** 项目使用 Prisma ORM，支持 MySQL、PostgreSQL 和 MongoDB 三种数据库。
      * **Schema 文件:** 不同数据库使用不同的 Schema 文件：
        - `prisma/schema.postgres.prisma` - PostgreSQL
        - `prisma/schema.mysql.prisma` - MySQL
        - `prisma/schema.mongo.prisma` - MongoDB
      * **连接:** 通过 `DATABASE_URL` 环境变量配置数据库连接。
      * **PrismaService:** 全局的 `PrismaService` 封装了 `PrismaClient`，提供数据库连接管理。
      * **数据操作:** 各业务 Service 通过注入 `PrismaService` 来进行数据库的增删改查操作。
  * **Redis:**
      * **连接:** `RedisService` 在构造函数中初始化一个 `ioredis` 实例，连接信息同样来自于 `ConfigService`。
      * **服务:** `RedisModule` 提供了 `RedisService`，它封装了一些常用的 Redis 操作，如 `set`, `get`, 和 `del`，并被注册为全局模块，可以在任何地方注入使用。

##### **4.5. 文件上传 (`src/modules/common/file`)**

  * **控制器:** `FileController` 定义了两个用于文件上传的端点 `/upload` 和 `/upload-files`。
  * **拦截器:**
      * `FileInterceptor` 用于处理单个文件上传。
      * `FilesInterceptor` 用于处理多个文件上传。
  * **文件存储:** 支持本地存储（uploads 目录）和阿里云 OSS 存储。
  * **验证:** `FileValidationPipe` 是一个自定义的管道，用于验证上传文件的大小。

### **5. 如何运行项目**

1.  **安装依赖:**

    ```bash
    pnpm install
    ```

2.  **配置环境变量:**
    复制 `.env.example` 文件为 `.env`，并根据你的本地环境修改配置。

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

    # JWT 配置
    JWT_SECRET=your-secret-key
    JWT_EXPIRES_IN=24h
    ```

3.  **选择并生成 Prisma Client:**

    根据你使用的数据库，运行对应的脚本：

    ```bash
    # PostgreSQL
    pnpm prisma:postgres

    # MySQL
    pnpm prisma:mysql

    # MongoDB
    pnpm prisma:mongo
    ```

4.  **同步数据库结构:**

    ```bash
    npx prisma db push
    ```

5.  **初始化数据（可选）:**

    ```bash
    pnpm init:admin
    ```

6.  **启动开发服务器:**

    ```bash
    pnpm start:dev
    ```

    应用将在 `http://localhost:3000` 上运行。

7.  **API 文档:**
    访问 `http://localhost:3000/api/v1/swagger` 查看 Swagger API 文档。

### **6. 项目初始化**

项目提供了初始化脚本，用于创建管理员账户、默认部门和系统菜单。

#### **运行初始化脚本**

```bash
# 确保先运行对应数据库的 Prisma 脚本
pnpm prisma:mysql  # 或 prisma:postgres / prisma:mongo

# 同步数据库结构
npx prisma db push

# 初始化数据
pnpm init:admin
```

#### **初始化内容**

脚本会自动创建以下数据：

**1. 内置角色**

| 角色名 | 权限 | 说明 |
| :-- | :-- | :-- |
| `admin` | `isSuper: true` | 超级管理员，拥有所有权限 |
| `user` | 无 | 默认用户角色，无后台权限（C端用户） |

> **注意:** 新版本使用 `isSuper` 标记和 `RoleMenu` 关联表来管理权限，替代了原来的 `permissions: ['*']` 数组。

**2. 默认部门**
| 部门名称 | 说明 |
| :-- | :-- |
| 总公司 | 系统默认一级部门 |

**3. 系统菜单结构**

```
Dashboard (仪表盘)
├── Analytics (分析页) - 默认首页，固定标签
└── Workspace (工作台)

System (系统管理)
├── Menu (菜单管理)
│   ├── system:menu:list (查看列表)
│   ├── system:menu:create (新增)
│   ├── system:menu:update (修改)
│   └── system:menu:delete (删除)
├── Dept (部门管理)
│   ├── system:dept:list (查看列表)
│   ├── system:dept:create (新增)
│   ├── system:dept:update (修改)
│   └── system:dept:delete (删除)
├── Role (角色管理)
│   ├── system:role:list (查看列表)
│   ├── system:role:query (查询详情)
│   ├── system:role:create (新增)
│   ├── system:role:update (修改)
│   └── system:role:delete (删除)
├── User (用户管理)
│   ├── system:user:list (查看列表)
│   ├── system:user:query (查询详情)
│   ├── system:user:create (新增)
│   ├── system:user:update (修改)
│   ├── system:user:delete (删除)
│   └── system:user:reset-password (重置密码)
└── Log (操作日志)
    ├── system:log:list (查看列表)
    ├── system:log:query (查询详情)
    └── system:log:delete (删除/清空)
```

**4. 管理员账户**
| 字段 | 值 |
| :-- | :-- |
| 用户名 | `admin` |
| 密码 | `admin123` |
| 昵称 | 超级管理员 |
| 角色 | `admin` |
| 部门 | 总公司 |

> ⚠️ **安全提示**: 请在首次登录后立即修改默认密码！

#### **重复执行**

初始化脚本支持重复执行，已存在的数据会被跳过：
- 已存在的角色、部门、菜单、用户不会重复创建
- 如果 admin 用户存在但未关联部门，会自动更新关联
- 角色权限会通过 RoleMenu 关联表更新为最新的菜单列表

#### **执行示例**

```bash
$ pnpm init:admin

========================================
       Nexus 初始化脚本 (Prisma)
========================================

[数据库] 使用 Prisma 连接...
[提示] 确保已运行正确的 prisma 脚本（如 pnpm prisma:postgres）
[数据库] 连接成功

[角色] 检查内置角色...
  [创建] admin 角色
  [创建] user 角色

[部门] 创建默认部门...
  [创建] 总公司（一级部门）

[菜单] 创建 Dashboard 菜单...
  [创建] 菜单: Dashboard (CATALOG)
  [创建] 菜单: Analytics (MENU)
  [创建] 菜单: Workspace (MENU)

[菜单] 创建系统菜单...
  [创建] 菜单: System (CATALOG)
  [创建] 菜单: SystemMenu (MENU)
  ...

[角色] 更新角色权限...
  [更新] admin 角色权限（27 个菜单）

[用户] 创建管理员用户...
  [创建] admin 用户
  [信息] 用户名: admin
  [信息] 密码: admin123
  [信息] 所属部门: 总公司
  [警告] 请登录后立即修改默认密码！

========================================
       初始化完成
========================================

[统计]
  菜单总数: 27
  用户总数: 1
  角色总数: 2
  部门总数: 1

[数据库] 连接已关闭
```

---

## 数据库配置

### **多数据库支持**

项目使用 Prisma ORM，支持三种数据库：

| 数据库 | Schema 文件 | 脚本命令 |
| :-- | :-- | :-- |
| PostgreSQL | `prisma/schema.postgres.prisma` | `pnpm prisma:postgres` |
| MySQL | `prisma/schema.mysql.prisma` | `pnpm prisma:mysql` |
| MongoDB | `prisma/schema.mongo.prisma` | `pnpm prisma:mongo` |

### **MongoDB Replica Set 配置**

> ⚠️ **重要**: Prisma 需要 MongoDB 以 **Replica Set 模式**运行才能支持事务功能。单机模式的 MongoDB 无法使用。

**什么是 Replica Set？**

Replica Set（副本集）是 MongoDB 的高可用架构，即使只有一个节点也需要配置。Prisma 的某些操作（如关联创建、批量操作）依赖 MongoDB 事务，而事务功能仅在 Replica Set 模式下可用。

#### **方案 1：Docker 快速启动（推荐）**

```bash
# 启动 MongoDB 容器
docker run -d --name mongodb-rs \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7 --replSet rs0

# 等待几秒后，初始化 replica set
docker exec -it mongodb-rs mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.initiate()"
```

`.env` 配置：
```bash
DATABASE_URL="mongodb://admin:password123@localhost:27017/nexus?authSource=admin&replicaSet=rs0"
```

#### **方案 2：本地 MongoDB 配置**

**macOS (Homebrew)：**

```bash
# 1. 找到配置文件位置
# Apple Silicon (M1/M2/M3): /opt/homebrew/etc/mongod.conf
# Intel Mac: /usr/local/etc/mongod.conf

# 2. 编辑配置文件，添加以下内容：
replication:
  replSetName: rs0

# 3. 重启 MongoDB
brew services restart mongodb-community

# 4. 初始化 replica set
mongosh --eval "rs.initiate()"
```

`.env` 配置：
```bash
DATABASE_URL="mongodb://localhost:27017/nexus?replicaSet=rs0"
```

#### **方案 3：MongoDB Atlas（云服务）**

使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 免费套餐，自动配置好 Replica Set：

```bash
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nexus?retryWrites=true&w=majority"
```

### **数据模型**

项目包含以下核心数据模型：

```
┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Role       │
├─────────────────┤     ├─────────────────┤
│ id (UUID)       │     │ id (UUID)       │
│ username        │     │ name            │
│ password        │     │ remark          │
│ nickName        │     │ status          │
│ email           │     │ isBuiltin       │
│ phone           │     │ isSuper         │
│ avatar          │     └────────┬────────┘
│ status          │              │
│ deptId ─────────┼──┐           │
│ remark          │  │           │
└────────┬────────┘  │           │
         │           │           │
         │           │           │
    ┌────┴────┐      │      ┌────┴────┐
    │ UserRole│      │      │RoleMenu │
    ├─────────┤      │      ├─────────┤
    │ userId  │      │      │ roleId  │
    │ roleId  │      │      │ menuId  │
    └─────────┘      │      └────┬────┘
                     │           │
              ┌──────┴───┐  ┌────┴────┐
              │   Dept   │  │  Menu   │
              ├──────────┤  ├─────────┤
              │ id       │  │ id      │
              │ name     │  │ name    │
              │ pid      │  │ title   │
              │ status   │  │ parentId│
              │ remark   │  │ path    │
              └──────────┘  │ type    │
                            │ authCode│
                            │ ...     │
                            └─────────┘
```

**关联表说明:**
- `UserRole`: 用户-角色多对多关联
- `RoleMenu`: 角色-菜单多对多关联（权限分配）

### **切换数据库步骤**

1. **修改 `.env` 文件中的 `DATABASE_URL`**

2. **运行对应的 Prisma 脚本**
   ```bash
   pnpm prisma:mysql  # 或 prisma:postgres / prisma:mongo
   ```

3. **同步数据库结构**
   ```bash
   npx prisma db push
   ```

4. **重新初始化数据（如需要）**
   ```bash
   pnpm init:admin
   ```

---

## 自定义验证装饰器

### **@IsId 装饰器**

`@IsId` 是一个通用的 ID 验证装饰器，用于验证 ID 字段格式。它会根据 `DATABASE_TYPE` 环境变量自动选择正确的验证方式：

- **PostgreSQL/MySQL**: 验证 UUID v4 格式（如 `550e8400-e29b-41d4-a716-446655440000`）
- **MongoDB**: 验证 ObjectId 格式（如 `507f1f77bcf86cd799439011`）

**文件位置**: `src/common/decorators/is-id.decorator.ts`

**使用示例:**

```typescript
import { IsId } from '@/common/decorators/is-id.decorator';
import { IsOptional, IsString } from 'class-validator';

export class CreateDeptDto {
  @IsString()
  name: string;

  /** 父级部门ID */
  @IsOptional()
  @IsId({ message: '父级部门ID格式不正确' })
  pid?: string;
}
```

**环境配置:**

在 `.env` 文件中配置数据库类型：

```bash
# 使用 PostgreSQL 或 MySQL 时
DATABASE_TYPE=postgres
# 或
DATABASE_TYPE=mysql

# 使用 MongoDB 时
DATABASE_TYPE=mongodb
```

**为什么需要这个装饰器？**

由于项目支持多种数据库，不同数据库使用不同的 ID 格式：

| 数据库 | ID 生成方式 | ID 格式 | 示例 |
| :-- | :-- | :-- | :-- |
| PostgreSQL | `@default(uuid())` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| MySQL | `@default(uuid())` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| MongoDB | `@default(auto()) @db.ObjectId` | ObjectId | `507f1f77bcf86cd799439011` |

使用 `@IsId` 装饰器可以避免在切换数据库时需要修改所有 DTO 文件中的验证装饰器（从 `@IsUUID` 改为 `@IsMongoId` 或反之）。

---

## config

### **1. `src/config/configuration.ts`：配置工厂函数**

这个文件导出一个默认函数，它被称为"配置工厂"（Configuration Factory）。它的职责是读取环境变量 (`process.env`) 并将它们组织成一个结构清晰、易于访问的 JavaScript 对象。

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

  * **结构化:** 它将相关的配置项组合在一起，例如所有数据库相关的配置都在 `database` 对象下。这使得配置项在代码中的调用非常直观，例如 `configService.get('database.url')`。
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

  // Database (Prisma)
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  // ... 其他 Redis 配置
});
```

**关键点:**

  * **强制性规则:** 通过 `.required()` 明确指定了哪些环境变量是必需的，比如 `JWT_SECRET` 和 `DATABASE_URL`。如果启动时没有提供这些变量，应用会立即报错并退出。
  * **类型和格式验证:** Joi 提供了丰富的验证规则。例如，`APP_PORT` 必须是一个数字 (`Joi.number()`)，`NODE_ENV` 必须是指定值之一。
  * **默认值:** 作为一种兜底机制。
  * **启动时验证:** 这是一种"快速失败"（Fail-fast）的策略，能尽早发现配置错误。

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
        PrismaModule,  // 全局 Prisma 模块
        // ... 其他模块
    ],
})
export class AppModule {}
```

1.  `ConfigModule.forRoot()`: 初始化配置模块。
2.  `isGlobal: true`: 将 `ConfigModule` 注册为全局模块，这样在其他任何模块中都可以直接注入 `ConfigService`。
3.  `load: [configuration]`: 告诉 `ConfigModule` 使用 `configuration.ts` 中的工厂函数来加载和组织配置。
4.  `validationSchema`: 将 `validation.ts` 中定义的 Joi 验证模式传递给配置模块，用于在启动时进行验证。


## 公共工具函数

### **ID 验证工具 (`src/common/utils/id.util.ts`)**

由于项目支持多种数据库（MongoDB、MySQL、PostgreSQL），不同数据库使用不同的 ID 格式：

| 数据库 | ID 格式 | 示例 |
| :-- | :-- | :-- |
| MongoDB | ObjectID (24位十六进制) | `507f1f77bcf86cd799439011` |
| MySQL | UUID (36位带连字符) | `550e8400-e29b-41d4-a716-446655440000` |
| PostgreSQL | UUID (36位带连字符) | `550e8400-e29b-41d4-a716-446655440000` |

为了确保代码在不同数据库间的兼容性，项目提供了统一的 ID 验证工具函数。

**工具函数：**

```typescript
import {
  isValidObjectId,      // 验证 MongoDB ObjectID
  isValidUuid,          // 验证 UUID
  isValidDatabaseId,    // 兼容验证（ObjectID 或 UUID）
  filterValidDatabaseIds // 从数组中过滤有效 ID
} from '@/common/utils';

// 示例
isValidObjectId('507f1f77bcf86cd799439011');  // true
isValidUuid('550e8400-e29b-41d4-a716-446655440000');  // true
isValidDatabaseId('507f1f77bcf86cd799439011');  // true（兼容两种格式）
isValidDatabaseId('user');  // false（非法格式）

// 过滤有效 ID
const ids = ['507f1f77bcf86cd799439011', 'user', 'invalid'];
filterValidDatabaseIds(ids);  // ['507f1f77bcf86cd799439011']
```

**使用场景：**

当需要同时使用名称和 ID 进行查询时，必须过滤有效的 ID 格式：

```typescript
// ❌ 错误：直接使用字符串查询 id 字段，MongoDB 会报错
const roles = await prisma.role.findMany({
  where: {
    OR: [
      { name: { in: ['admin', 'user'] } },
      { id: { in: ['admin', 'user'] } },  // 'user' 不是有效的 ObjectID！
    ],
  },
});

// ✅ 正确：先过滤出有效的数据库 ID
const validIds = filterValidDatabaseIds(['admin', 'user']);
const orConditions = [{ name: { in: ['admin', 'user'] } }];
if (validIds.length > 0) {
  orConditions.push({ id: { in: validIds } });
}
const roles = await prisma.role.findMany({
  where: { OR: orConditions },
});
```

**为什么需要这个工具？**

- **MongoDB 严格验证**：MongoDB 的 ObjectID 必须是 24 位十六进制字符串，传入 `"user"` 这样的字符串会直接报错 `Malformed ObjectID`
- **MySQL/PostgreSQL 隐式转换**：虽然不会报错，但会产生意外的查询结果
- **统一处理**：使用工具函数确保代码在所有数据库类型下都能正常工作

---

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

该项目包含了三个守卫：`auth.guard.ts`、`role.guard.ts` 和 `permission.guard.ts`。

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
import { UserService } from '@/modules/system/user/user.service';

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

#### **使用示例 (`src/modules/system/user/user.controller.ts`)**

`AuthGuard` 通过 `@UseGuards()` 装饰器应用在需要保护的路由上。

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';

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

这个守卫用于实现基于角色的访问控制（RBAC）。它检查当前登录的用户是否具有访问特定资源所必需的角色。

**代码分析:**

```typescript
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

export function RoleGuard(roles: string[] | string) {
    const normalizedRoles = Array.isArray(roles) ? roles : [roles];

    @Injectable()
    class RoleGuardClass implements CanActivate {
        async canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const userRoles: string[] = Array.isArray(user?.roles)
                ? user.roles
                : [];

            // admin 拥有所有权限
            if (userRoles.includes('admin')) {
                return true;
            }

            const res = normalizedRoles.some((role) =>
                userRoles.includes(role),
            );
            if (!res) {
                throw new UnauthorizedException('您没有权限访问');
            }
            return true;
        }
    }

    return RoleGuardClass;
}
```

**工作流程:**

1.  **工厂函数**: `RoleGuard` 本身不是一个守卫类，而是一个接收 `roles` 参数的工厂函数。`roles` 参数定义了允许访问该路由的角色列表。
2.  **依赖 `AuthGuard`**: 这个守卫的设计**假设 `AuthGuard` 已经先于它执行**，因此它可以安全地从 `request.user` 中获取用户信息和角色列表。
3.  **admin 超级权限**: `admin` 角色拥有所有权限，直接放行。
4.  **角色检查**: `canActivate` 方法的核心逻辑是检查 `user.roles` 数组中是否至少包含一个 `RoleGuard` 参数中指定的角色。
5.  **返回守卫**: 工厂函数最后返回一个真正的守卫类 `RoleGuardClass`。

#### **使用示例**

`RoleGuard` 和 `AuthGuard` 通常会一起使用。NestJS 会按照装饰器从下到上的顺序执行守卫。

```typescript
import { UseGuards, Post, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';

// ...

// 示例：这个接口只允许 'admin' 角色的用户访问
@UseGuards(RoleGuard(['admin'])) // <-- 2. RoleGuard 在 AuthGuard 之后执行
@UseGuards(AuthGuard)            // <-- 1. AuthGuard 首先执行，进行认证并挂载 user
@Post('delete-user')
async deleteUser(@Request() req) {
    // 只有 admin 用户才能执行到这里
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

-----

### **3. `src/common/guards/permission.guard.ts`：权限守卫（推荐）**

这是基于菜单权限码（authCode）的细粒度权限控制守卫，是系统管理模块推荐使用的权限控制方式。它通过检查用户角色关联的菜单权限来判断是否有权访问接口。

**代码分析:**

```typescript
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/common/modules/prisma';
import { PERMISSION_KEY } from '../decorator/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. 获取接口声明的权限码
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        // 2. 未声明权限码则直接放行
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 3. 未登录用户返回 401
        if (!user) {
            throw new UnauthorizedException('请先登录');
        }

        const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

        // 4. admin 角色拥有所有权限
        if (userRoles.includes('admin')) {
            return true;
        }

        // 5. 查询用户拥有的启用状态角色
        const roles = await this.prisma.role.findMany({
            where: {
                status: 0,
                OR: [
                    { name: { in: userRoles } },
                    { id: { in: userRoles } },
                ],
            },
            include: { menus: true },
        });

        // 6. 检查是否有超级管理员角色
        if (roles.some((role) => role.isSuper)) {
            return true;
        }

        // 7. 收集所有角色的菜单 ID
        const menuIds = new Set<string>();
        for (const role of roles) {
            for (const rm of role.menus ?? []) {
                menuIds.add(rm.menuId);
            }
        }

        if (menuIds.size === 0) {
            throw new ForbiddenException('您没有权限访问此资源');
        }

        // 8. 查询启用状态菜单的 authCode
        const menus = await this.prisma.menu.findMany({
            where: {
                id: { in: Array.from(menuIds) },
                status: 0,
            },
            select: { authCode: true },
        });

        const ownedAuthCodes = new Set<string>();
        for (const menu of menus) {
            if (menu.authCode) {
                ownedAuthCodes.add(menu.authCode);
            }
        }

        // 9. 检查是否包含要求的任一权限码
        const hasPermission = requiredPermissions.some((code) =>
            ownedAuthCodes.has(code),
        );

        if (!hasPermission) {
            throw new ForbiddenException('您没有权限访问此资源');
        }

        return true;
    }
}
```

**工作流程:**

1.  **获取权限声明**: 通过 `Reflector` 获取接口上通过 `@RequirePermission` 装饰器声明的权限码。
2.  **无权限声明放行**: 如果接口未声明权限码，直接放行。
3.  **认证检查**: 检查用户是否已登录（需配合 `AuthGuard` 使用）。
4.  **admin 超级权限**: `admin` 角色拥有所有权限，直接放行。
5.  **获取用户角色**: 从数据库查询用户所有启用状态的角色，包含 `RoleMenu` 关联。
6.  **isSuper 检查**: 检查是否有 `isSuper: true` 的角色，有则直接放行。
7.  **收集菜单权限**: 遍历角色的 `menus` 关联（RoleMenu 表），收集所有菜单 ID。
8.  **查询权限码**: 根据菜单 ID 查询对应的 `authCode`（仅启用状态的菜单）。
9.  **权限校验**: 检查用户拥有的权限码是否包含接口要求的任一权限码。

-----

### **4. `src/common/decorator/permission.decorator.ts`：权限装饰器**

配合 `PermissionGuard` 使用的权限声明装饰器。

**代码分析:**

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'require-permission';

/**
 * 权限声明装饰器
 * 用于在 Controller 方法上声明需要的权限码（authCode）
 * 支持传入多个权限码，满足任意一个即通过
 */
export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSION_KEY, permissions);
```

#### **使用示例（推荐方式）**

`PermissionGuard` 和 `AuthGuard` 配合使用，是系统管理模块的推荐权限控制方式：

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards, Body, Param } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';

@Controller('system/user')
@UseGuards(AuthGuard, PermissionGuard) // 在控制器级别应用守卫
export class SystemUserController {

    @Get('list')
    @RequirePermission('system:user:list') // 声明需要的权限码
    async findAll() {
        // 只有拥有 system:user:list 权限的用户才能访问
    }

    @Get(':id')
    @RequirePermission('system:user:query')
    async findOne(@Param('id') id: string) {
        // 需要 system:user:query 权限
    }

    @Post()
    @RequirePermission('system:user:create')
    async create(@Body() createUserDto: CreateUserDto) {
        // 需要 system:user:create 权限
    }

    @Put(':id')
    @RequirePermission('system:user:update')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        // 需要 system:user:update 权限
    }

    @Delete(':id')
    @RequirePermission('system:user:delete')
    async remove(@Param('id') id: string) {
        // 需要 system:user:delete 权限
    }

    @Put(':id/reset-password')
    @RequirePermission('system:user:reset-password')
    async resetPassword(@Param('id') id: string) {
        // 需要 system:user:reset-password 权限
    }

    // 支持多个权限码（满足任一即可）
    @Get('export')
    @RequirePermission('system:user:list', 'system:user:export')
    async export() {
        // 拥有 system:user:list 或 system:user:export 任一权限即可访问
    }
}
```

-----

### **守卫选择建议**

| 守卫 | 适用场景 | 特点 |
| :-- | :-- | :-- |
| `AuthGuard` | 所有需要登录的接口 | 基础认证，挂载用户信息 |
| `RoleGuard` | 简单的角色限制 | 基于角色名称，配置简单 |
| `PermissionGuard` | 细粒度权限控制（推荐） | 基于菜单权限码，灵活可配 |

**推荐组合:**
- 普通接口: `@UseGuards(AuthGuard)`
- 系统管理接口: `@UseGuards(AuthGuard, PermissionGuard)` + `@RequirePermission('xxx')`
- 简单角色限制: `@UseGuards(AuthGuard)` + `@UseGuards(RoleGuard(['admin']))`

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

1.  **RxJS `tap` 操作符**: 与 `map` 不同，`tap` 操作符允许你执行一些"副作用"（side effect），但**不会修改**流中的数据。在这里，它的副作用就是记录日志。`tap` 在 `Observable` 成功完成时执行，这意味着它会在 Controller 方法成功返回数据之后执行。
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

5.  **抛出异常**: 如果 `errors` 数组不为空，说明验证失败。管道会提取第一个错误的约束信息（例如，"password must be longer than or equal to 6 characters"），然后将其包装在一个 `HttpException` 中抛出，状态码为 `400 Bad Request`。这个异常随后会被我们之前分析过的 `HttpExceptionFilter` 捕获，并以统一的 JSON 格式返回给前端。

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

**1. 定义 DTO (`src/modules/system/user/dto/create-user.dto.ts`):**

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
    @Length(6, 20)
    password: string;
}
```

**2. 在 Controller 中使用 DTO (`src/modules/system/user/user.controller.ts`):**

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

`auth` 模块是整个应用的核心安全模块，它负责处理用户的**认证（Authentication）**，即"用户登录"和"令牌管理"。它与我们之前分析的 `AuthGuard` 和 `RoleGuard` 紧密协作，构成了完整的认证授权流程。


### **1. `src/modules/auth/auth.module.ts`：认证模块**

这个文件定义了 `AuthModule`，它将所有与认证相关的组件（Controller, Service, Strategy）组织在一起。

**代码分析:**

```typescript
import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../system/user/user.module';

@Module({
    imports: [
        // 导入 UserModule，以便复用 UserService 的功能
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy], // 注册服务和策略
})
export class AuthModule {}
```

**关键点:**

1.  **`UserModule`**: 导入 `UserModule`，因为认证服务需要查询用户信息。
2.  **`providers`**:
      * `AuthService`: 包含了登录和创建 Token 的核心业务逻辑。
      * `JwtStrategy`: 包含了验证 JWT 载荷（payload）的逻辑，供 `passport-jwt` 模块使用。

-----

### **2. `src/modules/auth/auth.service.ts`：认证服务**

这是认证模块的业务逻辑核心，处理用户登录验证和 JWT 的生成。

**代码分析:**

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/common/modules/prisma';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,     // 1. 注入 JWT 服务
        private prisma: PrismaService,      // 2. 注入 Prisma 服务
    ) {}

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        // 3. 查找用户（包含角色信息）
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                roles: {
                    include: { role: true },
                },
            },
        });

        if (!user) {
            throw new HttpException({ message: '用户不存在' }, 201);
        }

        // 4. 比较密码
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new HttpException({ message: '密码错误' }, 201);
        }

        // 5. 提取角色名称
        const roles = user.roles.map((ur) => ur.role.name);

        // 6. 返回用户信息用于生成 Token
        return {
            _id: user.id,
            username: user.username,
            roles,
        };
    }

    async createToken(user: any): Promise<string> {
        // 7. 使用 jwtService 生成 Token
        return this.jwtService.sign(user);
    }

    async logout(): Promise<void> {
        // 8. 服务端登出逻辑（通常为空）
        return;
    }
}
```

**关键点:**

1.  **注入 `JwtService`**: 这个服务由 `@nestjs/jwt` 模块提供，包含了 `sign` (签名) 和 `verify` (验证) 等处理 JWT 的核心方法。
2.  **注入 `PrismaService`**: 用于访问数据库。
3.  **查找用户**: 在 `login` 方法中，使用 Prisma 查询用户，并通过 `include` 加载 `UserRole` 和 `Role` 关联。
4.  **密码验证**: 使用 `bcrypt.compareSync` 来比较用户输入的明文密码和数据库中存储的哈希密码。这是保证密码安全的关键步骤。
5.  **提取角色**: 从 `UserRole` 关联中提取角色名称数组。
6.  **返回用户信息**: 验证成功后，返回一个不包含敏感信息（如密码）的用户对象。这个对象将作为 JWT 的载荷（Payload）。
7.  **创建 Token**: `createToken` 方法接收用户信息对象，并调用 `jwtService.sign` 来生成一个 JWT 字符串。
8.  **登出**: `logout` 方法是空的，这符合 JWT 的无状态特性。JWT 的登出操作通常在客户端完成（例如，删除本地存储的 Token）。

-----

### **3. `src/modules/auth/auth.controller.ts`：认证控制器**

这个控制器暴露了与认证相关的 HTTP 端点，主要是登录和登出。

**代码分析:**

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        // 1. 调用 AuthService 的 login 方法进行验证
        const user = await this.authService.login(loginDto);
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
2.  **`@Body()`**: 使用 `@Body()` 装饰器来获取请求体中的数据，并期望它符合 `LoginDto` 的结构。`ValidationPipe` 会在这里自动进行验证。
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
      * `AuthService` 通过 Prisma 查询数据库，使用 `bcrypt` 比较密码。
      * 验证成功后，`AuthService` 调用 `createToken()`，使用 `JwtService` 生成一个包含用户ID、用户名和角色的 JWT。
      * `AuthController` 将 JWT 和用户信息返回给客户端。

2.  **访问受保护资源**:

      * 客户端向一个受 `@UseGuards(AuthGuard)` 保护的接口（如 `GET /api/user/info`）发起请求，并在 `Authorization` 头中携带 `Bearer <JWT>`。
      * `AuthGuard` 拦截请求，从请求头中提取 Token。
      * `AuthGuard` 调用 `JwtService.verifyAsync()` 来验证 Token。这个过程内部会使用 `JwtStrategy` 中配置的密钥。
      * 验证成功后，`AuthGuard` 从 Token 载荷中获取 `_id`，通过 Prisma 查询数据库得到完整的 `user` 对象，并将其挂载到 `request.user`。
      * 请求继续被处理，此时控制器中的 `req.user` 就包含了当前登录用户的信息。

## 默认模块 user

这个模块是应用中与用户相关的核心业务模块，它负责管理用户数据，包括用户的创建、查询以及定义用户的数据结构。它与 `auth` 模块紧密相连，为认证和授权提供了基础数据支持。

### **1. 用户数据模型 (Prisma Schema)**

用户数据在 Prisma Schema 中定义如下：

```prisma
model User {
  id        String     @id @default(uuid())
  username  String     @unique
  password  String
  nickName  String
  email     String?    @unique
  phone     String?    @unique
  avatar    String?
  status    Int        @default(0)
  deptId    String?
  remark    String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  dept      Dept?      @relation(fields: [deptId], references: [id])
  roles     UserRole[]
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}
```

**关键点:**

1.  **UUID 主键**: 使用 `@default(uuid())` 生成唯一标识符，支持多数据库。
2.  **关联表 `UserRole`**: 用户和角色通过多对多关联表连接，替代了原来的 `roles: string[]` 数组。
3.  **部门关联**: 通过 `deptId` 外键关联到 `Dept` 表。

-----

### **2. `src/modules/system/user/dto/`：数据传输对象**

DTO (Data Transfer Object) 用于定义接口的输入/输出数据结构，并配合 `ValidationPipe` 进行数据验证。

  * **`create-user.dto.ts`**: 定义了创建用户（管理员）时需要传递的数据结构和验证规则。
  * **`register-user.dto.ts`**: 定义了用户注册时的数据结构，仅允许提交基本信息。
  * **`update-user.dto.ts`**: 定义了更新用户时的数据结构，使用 `PartialType` 使所有属性可选。

-----

### **3. `src/modules/system/user/user.service.ts`：用户服务**

这是用户模块的业务逻辑层，负责与数据库进行交互和处理数据。

**代码分析:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createUserDto: CreateUserDto) {
        // 1. 密码加密
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

        // 2. 查找角色
        const roles = await this.prisma.role.findMany({
            where: { name: { in: createUserDto.roles || ['user'] } },
        });

        // 3. 创建用户（包含 UserRole 关联）
        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                password: hashedPassword,
                nickName: createUserDto.nickName,
                // ... 其他字段
                roles: {
                    create: roles.map((role) => ({ roleId: role.id })),
                },
            },
            include: {
                roles: { include: { role: true } },
            },
        });

        return this.toResponseDto(user);
    }

    findOne(id: string) {
        // 4. 根据 ID 查找用户，排除密码字段
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                nickName: true,
                // ... 排除 password
                roles: { include: { role: true } },
            },
        });
    }
}
```

**关键点:**

1.  **密码哈希**: 使用 `bcryptjs` 库进行密码加密存储。
2.  **角色关联**: 通过 `roles.create` 在创建用户时同时创建 `UserRole` 关联记录。
3.  **查询优化**: 使用 `select` 排除敏感字段（如密码），使用 `include` 加载关联数据。

-----

### **4. `src/modules/system/user/user.controller.ts`：用户控制器**

控制器负责处理与用户相关的 HTTP 请求，并调用 `UserService` 来完成具体的业务逻辑。

```typescript
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(AuthGuard)
    @Get('info')
    async getInfo(@Request() req) {
        return req.user;
    }

    @Post('register')
    register(@Body() registerUserDto: RegisterUserDto) {
        return this.userService.register(registerUserDto);
    }
}
```

-----

### **5. `src/modules/system/user/user.module.ts`：用户模块**

模块文件将以上所有部分组合在一起。

```typescript
@Module({
    controllers: [UserController, SystemUserController],
    providers: [UserService, AuthGuard],
    exports: [UserService, AuthGuard],
})
export class UserModule {}
```

**关键点:**

1.  **无需导入 MongooseModule**: 因为 `PrismaModule` 是全局模块。
2.  **`exports`**: `UserModule` 导出了 `UserService` 和 `AuthGuard`，供其他模块使用。

### **总结**

`user` 模块是一个功能内聚的单元，它完整地封装了用户管理的全部逻辑：

  * **定义了 Prisma 数据模型** 和 **接口数据结构** (`dto/`)。
  * **处理核心业务逻辑** (`user.service.ts`)，特别是像密码加密和角色关联这样的操作。
  * **暴露安全的 API 端点** (`user.controller.ts`)，并通过守卫进行保护。
  * **封装并导出服务** (`user.module.ts`)，供其他模块复用。

## 默认模块 file

### **文件模块 (`src/modules/common/file`) 详解**

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

## 系统管理模块

系统管理模块提供了完整的后台权限管理功能，包括菜单管理、部门管理、角色管理和用户管理。这些模块采用基于菜单的权限控制体系（RBAC），实现了细粒度的权限控制。

### **权限体系架构**

```
┌─────────────────────────────────────┐
│         Menu Entity                 │
├─────────────────────────────────────┤
│ - name (唯一)                       │
│ - parentId (树形)                   │
│ - type (CATALOG/MENU/BUTTON/...)   │
│ - authCode (权限标识)               │
│ - status                            │
└──────────────┬──────────────────────┘
               │
               │ (通过 RoleMenu 关联)
               ▼
    ┌────────────────────────┐
    │   Role Entity          │
    ├────────────────────────┤
    │ - name (唯一)          │
    │ - isSuper (超级管理员) │
    │ - isBuiltin (内置角色) │
    │ - status               │
    │ - menus[] (RoleMenu)   │
    └───────────┬────────────┘
               │
               │ (通过 UserRole 关联)
               ▼
    ┌─────────────────────────┐
    │   User Entity           │
    ├─────────────────────────┤
    │ - username (唯一)       │
    │ - roles[] (UserRole)    │
    │ - deptId (部门ID)       │
    │ - status                │
    └──────────┬──────────────┘
               │
               │ (多对一)
               ▼
    ┌─────────────────────────┐
    │   Dept Entity           │
    ├─────────────────────────┤
    │ - name                  │
    │ - pid (树形)            │
    │ - status                │
    └─────────────────────────┘
```

> **注意**: 权限守卫 `PermissionGuard` 和权限装饰器 `@RequirePermission` 的详细说明请参阅 [公共 Guards](#公共-guards) 章节。

-----

### **菜单管理模块 (`src/modules/system/menu`)**

菜单管理模块负责管理系统的菜单结构，支持树形结构和多种菜单类型。

#### **数据模型 (Prisma)**

```prisma
model Menu {
  id                  String     @id @default(uuid())
  name                String     @unique
  title               String
  parentId            String?
  path                String
  component           String?
  type                MenuType
  authCode            String?
  order               Int        @default(0)
  status              Int        @default(0)
  icon                String?
  activeIcon          String?
  keepAlive           Boolean    @default(false)
  affixTab            Boolean    @default(false)
  hideInMenu          Boolean    @default(false)
  hideChildrenInMenu  Boolean    @default(false)
  hideInBreadcrumb    Boolean    @default(false)
  hideInTab           Boolean    @default(false)
  iframeSrc           String?
  link                String?
  activePath          String?
  badge               String?
  badgeType           BadgeType?
  badgeVariants       BadgeVariants?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  parent              Menu?      @relation("MenuTree", fields: [parentId], references: [id])
  children            Menu[]     @relation("MenuTree")
  roles               RoleMenu[]
}

enum MenuType {
  CATALOG
  MENU
  BUTTON
  EMBEDDED
  LINK
}
```

#### **API 接口**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| POST | `/api/menu` | 创建菜单 | system:menu:create |
| GET | `/api/menu/list` | 查询菜单列表（树结构） | system:menu:list |
| GET | `/api/menu/tree` | 获取菜单树（用于选择器） | system:menu:list |
| GET | `/api/menu/routes` | 获取动态路由（需认证） | - |
| GET | `/api/menu/codes` | 获取权限码列表（需认证） | - |
| GET | `/api/menu/name-exists` | 检查名称是否存在 | - |
| GET | `/api/menu/path-exists` | 检查路径是否存在 | - |
| GET | `/api/menu/:id` | 查询菜单详情 | system:menu:query |
| PUT | `/api/menu/:id` | 更新菜单 | system:menu:update |
| DELETE | `/api/menu/:id` | 删除菜单 | system:menu:delete |

-----

### **部门管理模块 (`src/modules/system/dept`)**

部门管理模块负责管理组织架构，支持树形结构。

#### **数据模型 (Prisma)**

```prisma
model Dept {
  id        String   @id @default(uuid())
  name      String
  pid       String?
  status    Int      @default(0)
  remark    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent    Dept?    @relation("DeptTree", fields: [pid], references: [id])
  children  Dept[]   @relation("DeptTree")
  users     User[]

  @@unique([pid, name])
}
```

#### **API 接口**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| GET | `/api/system/dept/list` | 获取部门列表（树形结构） | system:dept:list |
| POST | `/api/system/dept` | 创建部门 | system:dept:create |
| PUT | `/api/system/dept/:id` | 更新部门 | system:dept:update |
| DELETE | `/api/system/dept/:id` | 删除部门 | system:dept:delete |

-----

### **角色管理模块 (`src/modules/system/role`)**

角色管理模块负责管理系统角色，是权限体系的核心。

#### **数据模型 (Prisma)**

```prisma
model Role {
  id        String     @id @default(uuid())
  name      String     @unique
  remark    String     @default("")
  status    Int        @default(0)
  isBuiltin Boolean    @default(false)
  isSuper   Boolean    @default(false)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  users     UserRole[]
  menus     RoleMenu[]
}

model RoleMenu {
  roleId String
  menuId String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menu   Menu   @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@id([roleId, menuId])
}
```

**关键字段说明:**

| 字段 | 说明 |
| :-- | :-- |
| `isBuiltin` | 是否为内置角色（内置角色不可删除、不可修改名称） |
| `isSuper` | 是否为超级管理员（拥有所有权限，无需检查 RoleMenu） |
| `menus` | 通过 RoleMenu 关联表关联的菜单列表 |

**内置角色：**
- `admin` - 超级管理员，`isSuper: true`，拥有所有权限
- `user` - 普通用户，默认角色

#### **API 接口**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| GET | `/api/system/role/list` | 获取角色列表（分页） | system:role:list |
| GET | `/api/system/role/options` | 获取所有启用的角色（用于下拉选择） | - |
| GET | `/api/system/role/:id` | 获取角色详情 | system:role:query |
| POST | `/api/system/role` | 创建角色 | system:role:create |
| PUT | `/api/system/role/:id` | 更新角色 | system:role:update |
| DELETE | `/api/system/role/:id` | 删除角色 | system:role:delete |

-----

### **用户管理模块 (`src/modules/system/user`) - 更新**

用户模块在原有基础上进行了扩展，增加了系统管理相关功能。

#### **数据模型 (Prisma)**

```prisma
model User {
  id        String     @id @default(uuid())
  username  String     @unique
  password  String
  nickName  String
  email     String?    @unique
  phone     String?    @unique
  avatar    String?
  status    Int        @default(0)
  deptId    String?
  remark    String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  dept      Dept?      @relation(fields: [deptId], references: [id])
  roles     UserRole[]
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}
```

#### **API 接口**

**公开接口 (`/api/user`)：**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| GET | `/api/user/info` | 获取当前登录用户信息（需认证） | - |
| POST | `/api/user/register` | 用户注册（公开） | - |

**系统管理接口 (`/api/system/user`)：**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| GET | `/api/system/user/list` | 用户列表（分页） | system:user:list |
| GET | `/api/system/user/:id` | 用户详情 | system:user:query |
| POST | `/api/system/user` | 新增用户 | system:user:create |
| PUT | `/api/system/user/:id` | 更新用户 | system:user:update |
| DELETE | `/api/system/user/:id` | 删除用户 | system:user:delete |
| PUT | `/api/system/user/:id/status` | 更新用户状态 | system:user:update |
| PUT | `/api/system/user/:id/reset-password` | 重置用户密码 | system:user:reset-password |

-----

## 日志监控模块

日志监控模块提供了操作日志的记录、查询和管理功能，用于系统审计和问题排查。

### **操作日志模块 (`src/modules/system/oper-log`)**

操作日志模块自动记录系统中的关键操作，包括用户的增删改查等行为，便于追踪和审计。

#### **数据模型 (Prisma)**

```prisma
model OperLog {
  id            String   @id @default(uuid())
  title         String
  businessType  Int      @default(0)
  method        String?
  requestMethod String?
  operName      String?
  deptName      String?
  operUrl       String?
  operIp        String?
  operLocation  String?
  operParam     String?  @db.Text
  jsonResult    String?  @db.Text
  status        Int      @default(0)
  errorMsg      String?  @db.Text
  operTime      DateTime @default(now())
  costTime      Int      @default(0)
}
```

**业务类型枚举 (BusinessTypeEnum)：**

| 值 | 名称 | 描述 |
| :-- | :-- | :-- |
| 0 | OTHER | 其他 |
| 1 | INSERT | 新增 |
| 2 | UPDATE | 修改 |
| 3 | DELETE | 删除 |
| 4 | GRANT | 授权 |
| 5 | EXPORT | 导出 |
| 6 | IMPORT | 导入 |
| 7 | FORCE | 强退 |
| 8 | CLEAN | 清空 |

#### **API 接口**

| 方法 | 路径 | 描述 | 权限码 |
| :-- | :-- | :-- | :-- |
| GET | `/api/system/log/list` | 查询操作日志列表（分页） | system:log:list |
| GET | `/api/system/log/:id` | 查询操作日志详情 | system:log:query |
| DELETE | `/api/system/log/clean` | 清空所有操作日志 | system:log:delete |
| DELETE | `/api/system/log/:ids` | 删除操作日志（支持批量，逗号分隔） | system:log:delete |

#### **使用 @Log 装饰器**

操作日志通过 `@Log` 装饰器自动记录，无需手动调用服务。

**装饰器参数：**

```typescript
interface LogOptions {
    title: string;              // 模块标题
    businessType: BusinessTypeEnum;  // 业务类型
    isSaveRequestData?: boolean;     // 是否保存请求参数（默认 true）
    isSaveResponseData?: boolean;    // 是否保存响应数据（默认 true）
}
```

**使用示例：**

```typescript
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

@Controller('system/user')
@UseGuards(AuthGuard, PermissionGuard)
export class UserController {

    @Post()
    @RequirePermission('system:user:create')
    @Log({ title: '用户管理', businessType: BusinessTypeEnum.INSERT })
    async create(@Body() dto: CreateUserDto) {
        return this.userService.create(dto);
    }

    @Put(':id')
    @RequirePermission('system:user:update')
    @Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE })
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.userService.update(id, dto);
    }

    @Delete(':id')
    @RequirePermission('system:user:delete')
    @Log({ title: '用户管理', businessType: BusinessTypeEnum.DELETE })
    async remove(@Param('id') id: string) {
        return this.userService.remove(id);
    }

    // 敏感操作：不保存请求参数（如密码）
    @Put(':id/reset-password')
    @RequirePermission('system:user:reset-password')
    @Log({
        title: '用户管理',
        businessType: BusinessTypeEnum.UPDATE,
        isSaveRequestData: false  // 不记录密码
    })
    async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
        return this.userService.resetPassword(id, dto.password);
    }
}
```

-----

### **权限码命名规范**

权限码采用 `模块:资源:操作` 的格式，例如：

```
system:user:list      - 用户列表
system:user:query     - 用户查询
system:user:create    - 创建用户
system:user:update    - 更新用户
system:user:delete    - 删除用户
system:user:reset-password - 重置密码

system:role:list      - 角色列表
system:role:query     - 角色查询
system:role:create    - 创建角色
system:role:update    - 更新角色
system:role:delete    - 删除角色

system:dept:list      - 部门列表
system:dept:create    - 创建部门
system:dept:update    - 更新部门
system:dept:delete    - 删除部门

system:menu:list      - 菜单列表
system:menu:query     - 菜单查询
system:menu:create    - 创建菜单
system:menu:update    - 更新菜单
system:menu:delete    - 删除菜单

system:log:list       - 操作日志列表
system:log:query      - 操作日志查询
system:log:delete     - 删除/清空操作日志
```

-----

### **认证登录响应更新**

登录成功后，响应数据结构更新为：

```json
{
    "code": 0,
    "message": "请求成功",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "admin",
        "roles": ["admin"],
        "realName": "管理员"
    }
}
```

获取用户信息接口 (`GET /api/user/info`) 响应更新为：

```json
{
    "code": 0,
    "message": "请求成功",
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "admin",
        "realName": "管理员",
        "avatar": "https://...",
        "roles": ["admin"],
        "homePath": "/dashboard"
    }
}
```

---

## NPM Scripts

| 命令 | 描述 |
| :-- | :-- |
| `pnpm start:dev` | 启动开发服务器（热重载） |
| `pnpm build` | 构建生产版本 |
| `pnpm start:prod` | 启动生产服务器 |
| `pnpm prisma:postgres` | 生成 PostgreSQL Prisma Client |
| `pnpm prisma:mysql` | 生成 MySQL Prisma Client |
| `pnpm prisma:mongo` | 生成 MongoDB Prisma Client |
| `pnpm init:admin` | 初始化管理员数据 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm test` | 运行测试 |
