# Nexus

> ## 📖 AI 阅读指引
>
> 本项目文档已按模块拆分。请遵循以下策略：
>
> 1. **先阅读本文档**：了解项目概述、技术栈和文档索引
> 2. **分析用户需求**：明确涉及哪些功能模块
> 3. **按需查阅子文档**：仅读取与需求相关的子文档
>
> | 用户需求关键词 | 应查阅的文档 |
> |---------------|-------------|
> | 登录、JWT、Token、认证 | [认证授权](docs/authentication.md) |
> | 权限、角色、菜单、Guard | [认证授权](docs/authentication.md) |
> | 数据库、Prisma、MongoDB、MySQL | [数据库配置](docs/database.md) |
> | 用户管理、部门、系统管理 | [系统模块](docs/modules/system.md) |
> | 文件上传、OSS | [文件模块](docs/modules/file.md) |
> | 配置、环境变量、.env | [配置管理](docs/configuration.md) |
> | 拦截器、过滤器、管道 | [公共组件](docs/common/) 目录 |
> | 项目结构、技术栈 | [架构设计](docs/architecture.md) |
>
> ⚠️ **请勿一次性读取所有子文档**，这会造成上下文浪费。
>
> ⚠️ **请勿忽略子文档**，主文档仅提供概览，具体实现细节在子文档中。

---

## 简介

Nexus 是一个基于 NestJS 框架构建的后端应用程序，提供完整的企业级功能：

- **用户认证与授权:** 基于 JWT 的认证机制，以及基于角色的访问控制 (RBAC)
- **多数据库支持:** 使用 Prisma ORM 支持 MySQL、PostgreSQL 和 MongoDB
- **缓存系统:** 集成 Redis 用于缓存
- **文件上传:** 支持本地存储和阿里云 OSS
- **配置管理:** 通过环境变量配置，使用 Joi 验证
- **日志系统:** 使用 Winston 进行日志记录
- **API 文档:** 集成 Swagger 自动生成 API 文档

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | NestJS |
| 语言 | TypeScript |
| ORM | Prisma (MySQL / PostgreSQL / MongoDB) |
| 缓存 | Redis |
| 认证 | JWT + Passport |
| 文档 | Swagger |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

关键配置项：
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### 3. 初始化数据库

```bash
# 选择数据库类型
pnpm prisma:postgres  # 或 prisma:mysql / prisma:mongo

# 同步数据库结构
# 仅空白或可丢弃本地库使用 db push；已有数据的库按 docs/prisma-change-standard.md 使用 migration
npx prisma db push

# 初始化管理员数据（可选）
pnpm init:admin
```

### 4. 启动服务

```bash
pnpm start:dev
```

- 应用地址: `http://localhost:3000`
- API 文档: `http://localhost:3000/api/v1/swagger`

### 5. 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |

> ⚠️ 请在首次登录后立即修改默认密码！

---

## 文档索引

### 核心文档

| 文档 | 内容 | 适用场景 |
|------|------|----------|
| [架构设计](docs/architecture.md) | 项目结构、技术栈、启动流程 | 了解项目整体布局 |
| [配置管理](docs/configuration.md) | 环境变量、配置工厂、验证 | 修改配置项 |
| [数据库配置](docs/database.md) | 多数据库支持、Prisma、数据模型 | 数据库相关开发 |
| [认证授权](docs/authentication.md) | JWT、Guards、权限体系 | 权限相关开发 |

### 公共组件 (`docs/common/`)

| 文档 | 内容 |
|------|------|
| [过滤器](docs/common/filters.md) | HttpExceptionFilter - 统一异常处理 |
| [拦截器](docs/common/interceptors.md) | 响应格式化、请求日志 |
| [管道](docs/common/pipes.md) | ValidationPipe - 参数验证 |
| [装饰器](docs/common/decorators.md) | @IsId、@RequirePermission、@Log |

### 业务模块 (`docs/modules/`)

| 文档 | 内容 |
|------|------|
| [认证模块](docs/modules/auth.md) | 登录、Token 生成、JWT 策略 |
| [用户模块](docs/modules/user.md) | 用户管理、注册、个人信息 |
| [文件模块](docs/modules/file.md) | 文件上传、存储、验证 |
| [系统模块](docs/modules/system.md) | 菜单、角色、部门、操作日志 |

---

## NPM Scripts

| 命令 | 描述 |
|------|------|
| `pnpm start:dev` | 启动开发服务器（热重载） |
| `pnpm build` | 构建生产版本 |
| `pnpm start:prod` | 启动生产服务器 |
| `pnpm prisma:postgres` | 生成 PostgreSQL Prisma Client |
| `pnpm prisma:mysql` | 生成 MySQL Prisma Client |
| `pnpm prisma:mongo` | 生成 MongoDB Prisma Client |
| `pnpm init:admin` | 初始化管理员数据 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm test` | 运行测试 |
