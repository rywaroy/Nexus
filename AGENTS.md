# Nexus Agent 规则

本文件约束自动化代理在本模板项目中的默认工作方式。回答默认使用简体中文，代码标识符使用英文。

## 项目概览

Nexus 是 NestJS 后端 API 服务，使用 Prisma ORM，支持 MySQL、PostgreSQL、MongoDB 多数据库 schema。

关键目录：

- `src/`：NestJS 应用代码
- `prisma/`：Prisma schema 与迁移
- `scripts/`：初始化与数据处理脚本
- `docs/`：项目文档

## 常用命令

```bash
# 安装依赖
pnpm install

# 选择并生成 Prisma Client
pnpm prisma:mysql
pnpm prisma:postgres
pnpm prisma:mongo

# 开发
pnpm start:dev

# 构建
pnpm build

# 测试
pnpm test

# 初始化管理员数据
pnpm init:admin
```

## 数据库变更强制规范

所有 SQL 表结构变更、索引、枚举、约束、默认值、初始化数据、补充数据、修复脏数据，都必须先阅读并遵守：

```text
docs/prisma-change-standard.md
```

简要红线：

- 已有有效数据的数据库禁止使用 `prisma db push`，必须走 Prisma Migrate。
- 生产、测试、预发环境只允许 `npx prisma migrate deploy`，禁止 `migrate dev` / `migrate reset`。
- 修改 schema 时必须改对应源 schema，例如 `prisma/schema.mysql.prisma`，不要只改 `prisma/schema.prisma`。
- 数据补丁必须可审查、尽量幂等，复杂回填优先用 Prisma Client 脚本。
- 遇到 P3005 或迁移历史缺失时，按详细规范做 baseline，不要删表或强推结构。

## 验证要求

完成数据库相关改动前，按 `docs/prisma-change-standard.md` 执行验证。常用基础检查：

```bash
npx prisma validate
npx prisma migrate status
pnpm test
```

## 文档入口

- `docs/prisma-change-standard.md`：数据库变更强制规范
- `docs/prisma-workflow.md`：Prisma 日常工作流
- `docs/database.md`：数据库配置说明
- `README.md`：项目启动说明
