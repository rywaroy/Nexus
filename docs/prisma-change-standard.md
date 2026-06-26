# Prisma 数据库变更规范

本文档是 Nexus 模板项目的数据库变更强制规范。凡是涉及 SQL 表结构、索引、枚举、约束、默认值、初始化数据、补充数据、修复脏数据的改动，都必须按本文执行。

## 核心原则

- 任何可能包含有效数据的数据库，禁止使用 `prisma db push` 变更结构。
- 表结构变更必须使用 Prisma Migrate 生成迁移文件，先审查 SQL，再执行。
- 数据补丁必须可审查、可重复执行或有明确幂等保护。
- 生产、测试、预发环境只允许执行 `prisma migrate deploy`，不允许执行 `prisma migrate dev`。
- 变更前必须确认 `DATABASE_URL` 指向目标数据库，并完成备份。
- 变更后必须验证表结构、数据量、关键业务路径和 Prisma Client。

## 环境与 Schema

项目维护多个 Prisma schema：

| 数据库 | Schema 文件 | 生成命令 |
| --- | --- | --- |
| MySQL | `prisma/schema.mysql.prisma` | `pnpm prisma:mysql` |
| PostgreSQL | `prisma/schema.postgres.prisma` | `pnpm prisma:postgres` |
| MongoDB | `prisma/schema.mongo.prisma` | `pnpm prisma:mongo` |

`prisma/schema.prisma` 是运行时 schema，由上述命令复制生成。生产环境必须使用与 `DATABASE_URL` 匹配的命令生成 Prisma Client。

```bash
cd Nexus
pnpm prisma:mysql
```

生成错 schema 会导致 Prisma Client 缺少对应 model delegate，例如 `prisma.exampleModel` 为 `undefined`。

## 表结构变更流程

适用场景：新增表、改字段、改枚举、加索引、加唯一约束、调整外键、修改默认值等。

### 1. 修改源 schema

先修改目标数据库对应的源 schema 文件，不要只修改 `prisma/schema.prisma`。

```text
prisma/schema.mysql.prisma
prisma/schema.postgres.prisma
prisma/schema.mongo.prisma
```

然后同步运行时 schema 并生成 Prisma Client：

```bash
cd Nexus
pnpm prisma:mysql
```

### 2. 生成迁移但不执行

MySQL / PostgreSQL 开发环境创建迁移文件：

```bash
cd Nexus
npx prisma migrate dev --name describe_change --create-only
```

迁移名使用英文小写和下划线，例如：

```text
add_user_avatar
add_order_status_index
backfill_menu_permissions
```

### 3. 审查迁移 SQL

必须打开并审查新生成的：

```text
prisma/migrations/<timestamp>_<name>/migration.sql
```

允许的常见操作：

```sql
ALTER TABLE ... ADD COLUMN ...
ALTER TABLE ... MODIFY COLUMN ...
CREATE TABLE ...
CREATE INDEX ...
ALTER TABLE ... ADD CONSTRAINT ...
```

高风险操作必须单独确认：

```sql
DROP TABLE
DROP DATABASE
TRUNCATE
DELETE
DROP COLUMN
ALTER TABLE ... DROP INDEX
ALTER TABLE ... DROP FOREIGN KEY
```

如果确实需要删除字段或表，必须先确认数据是否可丢弃，并提供备份、回滚和业务影响说明。

### 4. 处理已有数据

已有表新增非空字段时，不允许一步到位直接加无默认值的 `NOT NULL` 字段。按下面顺序拆分：

1. 新增 nullable 字段，或新增带安全默认值的字段。
2. 使用数据补丁回填历史数据。
3. 验证无空值。
4. 再创建第二个迁移，将字段改为 `NOT NULL`。

示例：

```sql
SELECT COUNT(*) FROM users WHERE newColumn IS NULL;
```

只有结果为 `0`，才允许进入收紧约束的迁移。

### 5. 本地验证

开发库执行：

```bash
cd Nexus
npx prisma migrate dev
pnpm test
```

若只改数据库相关模块，可运行更小范围测试，但必须至少验证受影响业务路径。

### 6. 生产部署

生产执行顺序：

```bash
cd /path/to/Nexus
grep DATABASE_URL .env
mysqldump -u<user> -p <database> > ~/backup_$(date +%Y%m%d%H%M%S).sql
pnpm prisma:mysql
npx prisma migrate deploy
pnpm build
pm2 restart server
```

部署后验证：

```bash
npx prisma migrate status
node -e 'const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient(); console.log(Object.keys(p).filter((k)=>!k.startsWith("_")&&!k.startsWith("$")).join(",")); p.$disconnect()'
```

涉及新表或新字段时，还要执行 SQL 验证：

```sql
SHOW TABLES LIKE 'target_table';
SHOW COLUMNS FROM target_table;
SELECT COUNT(*) FROM target_table;
```

## 数据补丁流程

适用场景：新增菜单、补历史状态、修正错误数据、初始化业务配置、回填新字段。

优先级：

1. 可长期重复执行的初始化逻辑，写入 `scripts/init-admin.ts` 或专用 TypeScript 脚本。
2. 一次性数据修复，写入 `prisma/patches/*.mysql.sql`。没有目录时先创建 `prisma/patches/`。
3. 复杂回填，使用 TypeScript 脚本通过 Prisma Client 分批处理。

### SQL 补丁规范

SQL 补丁文件命名：

```text
prisma/patches/YYYY-MM-DD-short-description.mysql.sql
```

必须包含：

- 变更目的注释。
- 幂等保护，例如 `INSERT ... SELECT ... WHERE NOT EXISTS`、`INSERT IGNORE`、`ON DUPLICATE KEY UPDATE`。
- 变更前检查 SQL。
- 变更后验证 SQL。

示例：

```sql
-- 目的：补充后台菜单。
-- 执行前检查：
-- SELECT id, name FROM menus WHERE name = 'ExampleMenu';

INSERT INTO menus (...)
SELECT ...
WHERE NOT EXISTS (
  SELECT 1 FROM menus WHERE name = 'ExampleMenu'
);

-- 执行后验证：
-- SELECT id, name, path FROM menus WHERE name = 'ExampleMenu';
```

生产执行前必须先查看影响范围：

```sql
SELECT COUNT(*) FROM target_table WHERE condition;
```

生产执行后必须记录实际影响行数，并验证关键数据。

### TypeScript 数据脚本规范

适用复杂数据回填，例如跨表查询、分批处理、需要业务逻辑判断。

脚本要求：

- 使用 Prisma Client，不直接拼接动态 SQL。
- 支持 dry-run 或先输出待处理数量。
- 分批处理大量数据，避免一次性读写全表。
- 写入前有明确 where 条件，禁止无条件 updateMany/deleteMany。
- 执行后输出处理数量和跳过数量。

推荐命令形式：

```bash
cd Nexus
pnpm prisma:mysql
npx ts-node -r tsconfig-paths/register scripts/backfill-example.ts --dry-run
npx ts-node -r tsconfig-paths/register scripts/backfill-example.ts
```

## Baseline 规范

如果已有生产库不是通过 Prisma Migrate 创建，第一次执行 `npx prisma migrate deploy` 可能出现：

```text
Error: P3005
The database schema is not empty.
```

这时不要删除表，也不要 `db push`。必须先确认 baseline migration 对应的是当前已有表结构，然后只登记 baseline：

```bash
cd Nexus
npx prisma migrate resolve --applied <baseline_migration_folder_name>
npx prisma migrate deploy
```

如果某个后续迁移已经由人工 SQL 执行过，也只能在确认表结构完全一致后登记：

```bash
npx prisma migrate resolve --applied <migration_folder_name>
npx prisma migrate deploy
```

登记前必须验证对应对象已经存在：

```sql
SHOW TABLES LIKE 'target_table';
SHOW COLUMNS FROM target_table;
```

## 禁止事项

- 禁止在生产、测试、预发环境执行 `npx prisma db push`。
- 禁止在生产环境执行 `npx prisma migrate dev` 或 `npx prisma migrate reset`。
- 禁止未备份直接改生产结构。
- 禁止手写 SQL 改完结构但不补 Prisma schema 和 migration。
- 禁止只修改 `prisma/schema.prisma`，不修改源 schema 文件。
- 禁止将数据修复混在无关业务代码提交里。
- 禁止无条件 `DELETE`、`TRUNCATE`、`DROP`。

## 变更检查清单

提交前：

- [ ] 已修改正确的源 schema 文件。
- [ ] 已运行正确的 `pnpm prisma:*` 命令生成 `schema.prisma` 和 Prisma Client。
- [ ] 已生成 migration，并审查 `migration.sql`。
- [ ] migration 不包含未确认的破坏性 SQL。
- [ ] 需要回填的数据已有补丁或脚本。
- [ ] 本地已执行验证命令。

上线前：

- [ ] 已确认 `DATABASE_URL`。
- [ ] 已备份目标数据库。
- [ ] 已确认是否需要 baseline。
- [ ] 已准备执行顺序和回滚方式。

上线后：

- [ ] `npx prisma migrate status` 正常。
- [ ] 新表、新字段、索引或枚举已验证。
- [ ] 数据补丁影响行数符合预期。
- [ ] Prisma Client delegate 可用。
- [ ] 关键业务路径验证通过。
