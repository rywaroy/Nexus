# Prisma 工作流指南

本文档描述 Prisma 的日常命令和执行流程。数据库变更的强制规范见：

```text
docs/prisma-change-standard.md
```

凡是涉及已有数据库的表结构或数据变更，必须先按该规范执行。

## 项目 Schema 文件

项目支持多种数据库，对应不同的 schema 文件：

| 文件 | 数据库 | 命令 |
|------|--------|------|
| `prisma/schema.mongo.prisma` | MongoDB | `pnpm prisma:mongo` |
| `prisma/schema.postgres.prisma` | PostgreSQL | `pnpm prisma:postgres` |
| `prisma/schema.mysql.prisma` | MySQL | `pnpm prisma:mysql` |

> **注意**：`prisma/schema.prisma` 是运行时使用的文件，由上述命令自动复制生成。

---

## 修改表结构后的操作

### MongoDB

MongoDB 是 schemaless 数据库，通常不需要 SQL migration。修改 schema 后重新生成 Prisma Client：

```bash
# 1. 修改 prisma/schema.mongo.prisma
# 2. 重新生成 Prisma Client
pnpm prisma:mongo
```

### PostgreSQL / MySQL

关系型数据库必须使用 Prisma Migrate 保留迁移历史。

开发环境生成迁移：

```bash
pnpm prisma:mysql
npx prisma migrate dev --name describe_change --create-only
```

审查生成的 `migration.sql` 后，本地开发库执行：

```bash
npx prisma migrate dev
```

测试、预发、生产环境执行：

```bash
npx prisma migrate deploy
```

`npx prisma db push` 只允许用于空的、可随时丢弃的本地实验库。任何已有有效数据的数据库都禁止使用。

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `npx prisma generate` | 生成 Prisma Client（更新 TypeScript 类型） |
| `npx prisma db push` | 仅空白或可丢弃本地库使用，不创建迁移文件 |
| `npx prisma migrate dev` | 创建并应用迁移（开发用） |
| `npx prisma migrate deploy` | 应用迁移（生产环境） |
| `npx prisma studio` | 打开数据库可视化管理界面 |
| `npx prisma db pull` | 从现有数据库反向生成 schema |
| `npx prisma format` | 格式化 schema 文件 |
| `npx prisma validate` | 验证 schema 文件语法 |

---

## 开发工作流示例

### 添加新字段

```bash
# 1. 编辑 schema 文件，添加新字段
# 例如在 User 模型中添加 avatar 字段

# 2. MySQL / PostgreSQL：生成迁移，先审查 SQL
pnpm prisma:mysql
npx prisma migrate dev --name add_avatar_to_user --create-only

# 3. 审查迁移后执行
npx prisma migrate dev

# 4. 更新业务代码使用新字段
```

### 添加新模型（表）

```bash
# 1. 在 schema 文件中定义新模型
model NewModel {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("new_models")
}

# 2. MySQL / PostgreSQL：生成迁移，先审查 SQL
pnpm prisma:mysql
npx prisma migrate dev --name add_new_model --create-only

# 3. 审查迁移后执行
npx prisma migrate dev

# 4. 创建对应的 Service、Controller 等
```

### 补充或修复数据

优先写幂等脚本或 SQL patch：

```text
prisma/patches/YYYY-MM-DD-short-description.mysql.sql
```

补丁必须包含执行前检查、幂等保护和执行后验证。复杂回填使用 TypeScript 脚本通过 Prisma Client 分批处理。

---

## 常见问题

### 1. TypeScript 报错：字段不存在

**原因**：修改了 schema 但没有重新生成 Prisma Client。

**解决**：
```bash
pnpm prisma:mongo
# 或
npx prisma generate
```

### 2. 数据库和 schema 不同步

**解决**：
```bash
# 查看差异，不直接改库
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

已有数据的数据库必须通过 migration 修正，不能用 `db push` 强行同步。

### 3. 重置开发数据库

```bash
# 删除所有数据并重新应用迁移
npx prisma migrate reset
```

只允许在可丢弃的本地开发库执行。

### 4. P3005：数据库非空但没有迁移历史

生产或已有库第一次接入 Prisma Migrate 时可能出现：

```text
Error: P3005
The database schema is not empty.
```

处理方式是 baseline，不是删表：

```bash
npx prisma migrate resolve --applied <baseline_migration_folder_name>
npx prisma migrate deploy
```

---

## 相关链接

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Schema 参考](https://www.prisma.io/docs/orm/prisma-schema)
- [Prisma Client API](https://www.prisma.io/docs/orm/prisma-client)
