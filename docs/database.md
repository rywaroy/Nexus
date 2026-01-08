# 数据库配置

<!-- AI Context: 本文档描述多数据库支持、Prisma 配置和数据模型，适用于数据库相关开发 -->

## 多数据库支持

项目使用 Prisma ORM，支持三种数据库：

| 数据库 | Schema 文件 | 脚本命令 |
|--------|-------------|----------|
| PostgreSQL | `prisma/schema.postgres.prisma` | `pnpm prisma:postgres` |
| MySQL | `prisma/schema.mysql.prisma` | `pnpm prisma:mysql` |
| MongoDB | `prisma/schema.mongo.prisma` | `pnpm prisma:mongo` |

## 切换数据库步骤

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

## MongoDB Replica Set 配置

> ⚠️ **重要**: Prisma 需要 MongoDB 以 **Replica Set 模式**运行才能支持事务功能。

### 方案 1：Docker 快速启动（推荐）

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

### 方案 2：本地 MongoDB 配置

**macOS (Homebrew)：**

```bash
# 编辑配置文件，添加以下内容：
# Apple Silicon: /opt/homebrew/etc/mongod.conf
# Intel Mac: /usr/local/etc/mongod.conf
replication:
  replSetName: rs0

# 重启 MongoDB
brew services restart mongodb-community

# 初始化 replica set
mongosh --eval "rs.initiate()"
```

### 方案 3：MongoDB Atlas（云服务）

使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 免费套餐，自动配置好 Replica Set：

```bash
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nexus?retryWrites=true&w=majority"
```

## 数据模型

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

## ID 验证工具

由于不同数据库使用不同的 ID 格式，项目提供了统一的 ID 验证工具：

| 数据库 | ID 格式 | 示例 |
|--------|---------|------|
| MongoDB | ObjectID (24位十六进制) | `507f1f77bcf86cd799439011` |
| MySQL | UUID (36位带连字符) | `550e8400-e29b-41d4-a716-446655440000` |
| PostgreSQL | UUID (36位带连字符) | `550e8400-e29b-41d4-a716-446655440000` |

**工具函数 (`src/common/utils/id.util.ts`)：**

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
filterValidDatabaseIds(['507f1f77bcf86cd799439011', 'user', 'invalid']);  // ['507f1f77bcf86cd799439011']
```

**使用场景：**

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
```

## @IsId 装饰器

`@IsId` 是一个通用的 ID 验证装饰器，根据 `DATABASE_TYPE` 环境变量自动选择验证方式：

```typescript
import { IsId } from '@/common/decorators/is-id.decorator';

export class CreateDeptDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsId({ message: '父级部门ID格式不正确' })
  pid?: string;
}
```

**环境配置:**

```bash
DATABASE_TYPE=postgres  # 验证 UUID
DATABASE_TYPE=mongodb   # 验证 ObjectId
```

## PrismaService

全局的 `PrismaService` 封装了 `PrismaClient`，提供数据库连接管理：

```typescript
// 在任何 Service 中注入使用
@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }
}
```
