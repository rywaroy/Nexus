# 用户模块

<!-- AI Context: 本文档描述 user 模块，包括用户管理和系统用户管理 -->

## 概述

`user` 模块负责用户数据管理，包含两个控制器：
- `UserController`: 公开接口（获取当前用户信息、注册）
- `SystemUserController`: 系统管理接口（用户 CRUD）

**文件位置:** `src/modules/system/user/`

## 数据模型

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

## API 接口

### 公开接口 (`/api/user`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/user/info` | 获取当前登录用户信息 | 需要 |
| POST | `/api/user/register` | 用户注册 | 无 |

### 系统管理接口 (`/api/system/user`)

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/user/list` | 用户列表（分页） | system:user:list |
| GET | `/api/system/user/:id` | 用户详情 | system:user:query |
| POST | `/api/system/user` | 新增用户 | system:user:create |
| PUT | `/api/system/user/:id` | 更新用户 | system:user:update |
| DELETE | `/api/system/user/:id` | 删除用户 | system:user:delete |
| PUT | `/api/system/user/:id/status` | 更新用户状态 | system:user:update |
| PUT | `/api/system/user/:id/reset-password` | 重置用户密码 | system:user:reset-password |

## UserService 核心方法

```typescript
@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createUserDto: CreateUserDto) {
        // 密码加密
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

        // 查找角色
        const roles = await this.prisma.role.findMany({
            where: { name: { in: createUserDto.roles || ['user'] } },
        });

        // 创建用户（包含 UserRole 关联）
        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                password: hashedPassword,
                nickName: createUserDto.nickName,
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

## DTO 定义

### CreateUserDto

```typescript
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    password: string;

    @IsString()
    @IsNotEmpty()
    nickName: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsArray()
    roles?: string[];

    @IsOptional()
    @IsId()
    deptId?: string;
}
```

### RegisterUserDto

```typescript
export class RegisterUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    password: string;

    @IsString()
    @IsNotEmpty()
    nickName: string;
}
```

## 获取用户信息响应

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

## 模块导出

```typescript
@Module({
    controllers: [UserController, SystemUserController],
    providers: [UserService, AuthGuard],
    exports: [UserService, AuthGuard],  // 供其他模块使用
})
export class UserModule {}
```
