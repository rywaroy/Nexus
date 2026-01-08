# 认证模块

<!-- AI Context: 本文档描述 auth 模块，包括登录、Token 生成和 JWT 策略 -->

## 概述

`auth` 模块处理用户认证，包括登录验证和 JWT Token 管理。

**文件位置:** `src/modules/auth/`

## 模块结构

```
auth/
├── auth.module.ts      # 模块定义
├── auth.controller.ts  # 控制器
├── auth.service.ts     # 服务
├── jwt.strategy.ts     # JWT 策略
└── dto/
    └── login.dto.ts    # 登录 DTO
```

## API 接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 无 |
| POST | `/api/auth/logout` | 用户登出 | 无 |

## AuthService

```typescript
@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        // 查找用户（包含角色信息）
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

        // 比较密码
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new HttpException({ message: '密码错误' }, 201);
        }

        // 提取角色名称
        const roles = user.roles.map((ur) => ur.role.name);

        return {
            _id: user.id,
            username: user.username,
            roles,
        };
    }

    async createToken(user: any): Promise<string> {
        return this.jwtService.sign(user);
    }

    async logout(): Promise<void> {
        // JWT 无状态，服务端无需操作
        return;
    }
}
```

## AuthController

```typescript
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.login(loginDto);
        const token = await this.authService.createToken(user);
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

## 登录响应格式

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

## 认证流程

1. 客户端发送用户名和密码到 `/api/auth/login`
2. `AuthService` 通过 Prisma 查询用户
3. 使用 `bcrypt` 比较密码
4. 验证成功后生成 JWT（包含用户ID、用户名、角色）
5. 返回 `accessToken` 和用户信息

## 模块依赖

```typescript
@Module({
    imports: [UserModule],  // 复用 UserService
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```
