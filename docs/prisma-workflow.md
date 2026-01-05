# Prisma 工作流指南

本文档描述了在 Nexus 项目中使用 Prisma 的常见操作流程。

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

### MongoDB（当前使用）

MongoDB 是 schemaless 数据库，不需要迁移。修改 schema 后只需重新生成 Prisma Client：

```bash
# 1. 修改 prisma/schema.mongo.prisma
# 2. 重新生成 Prisma Client
pnpm prisma:mongo
```

### PostgreSQL / MySQL

关系型数据库需要同步 schema 到数据库：

```bash
# 方式一：快速同步（开发阶段，不保留迁移历史）
npx prisma db push

# 方式二：创建迁移（推荐，保留迁移历史）
npx prisma migrate dev --name "描述本次修改"

# 方式三：生产环境部署
npx prisma migrate deploy
```

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `npx prisma generate` | 生成 Prisma Client（更新 TypeScript 类型） |
| `npx prisma db push` | 将 schema 推送到数据库（开发用，不创建迁移文件） |
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

# 2. 重新生成 Client
pnpm prisma:mongo  # MongoDB
# 或
npx prisma migrate dev --name "add_avatar_to_user"  # PostgreSQL/MySQL

# 3. 更新业务代码使用新字段
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

# 2. 重新生成 Client
pnpm prisma:mongo

# 3. 创建对应的 Service、Controller 等
```

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
# 查看差异
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma

# 同步到数据库
npx prisma db push
```

### 3. 重置开发数据库

```bash
# 删除所有数据并重新应用迁移
npx prisma migrate reset
```

---

## 相关链接

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Schema 参考](https://www.prisma.io/docs/orm/prisma-schema)
- [Prisma Client API](https://www.prisma.io/docs/orm/prisma-client)
