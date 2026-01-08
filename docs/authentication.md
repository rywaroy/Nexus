# 认证与授权

<!-- AI Context: 本文档描述认证授权体系，包含 JWT、AuthGuard、RoleGuard、PermissionGuard，适用于权限相关开发 -->

## 概述

项目采用基于 JWT 的认证机制和基于角色/权限的访问控制 (RBAC)。

## 守卫 (Guards)

### 1. AuthGuard - JWT 认证守卫

核心认证守卫，保护需要登录后才能访问的接口。

**文件位置:** `src/common/guards/auth.guard.ts`

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userSerivce: UserService,
        private configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const { _id } = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.secret'),
            });
            const user = await this.userSerivce.findOne(_id);
            request['user'] = user;  // 将用户信息附加到请求对象
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }
}
```

**工作流程:**

1. 从 `Authorization` 头中提取 Bearer Token
2. 使用 `JwtService` 验证 Token
3. 从数据库查询完整用户信息
4. 将用户信息挂载到 `request.user`

**使用示例:**

```typescript
@UseGuards(AuthGuard)
@Get('info')
async getInfo(@Request() req) {
    return req.user;  // 可直接获取当前登录用户
}
```

### 2. RoleGuard - 角色守卫

基于角色名称的简单访问控制。

**文件位置:** `src/common/guards/role.guard.ts`

```typescript
export function RoleGuard(roles: string[] | string) {
    const normalizedRoles = Array.isArray(roles) ? roles : [roles];

    @Injectable()
    class RoleGuardClass implements CanActivate {
        async canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];

            // admin 拥有所有权限
            if (userRoles.includes('admin')) {
                return true;
            }

            const res = normalizedRoles.some((role) => userRoles.includes(role));
            if (!res) {
                throw new UnauthorizedException('您没有权限访问');
            }
            return true;
        }
    }

    return RoleGuardClass;
}
```

**使用示例:**

```typescript
@UseGuards(RoleGuard(['admin']))
@UseGuards(AuthGuard)  // AuthGuard 必须先执行
@Post('delete-user')
async deleteUser() { ... }
```

### 3. PermissionGuard - 权限守卫（推荐）

基于菜单权限码 (authCode) 的细粒度权限控制，是系统管理模块推荐的方式。

**文件位置:** `src/common/guards/permission.guard.ts`

**工作流程:**

1. 获取接口上声明的权限码（通过 `@RequirePermission` 装饰器）
2. 未声明权限码则直接放行
3. 检查用户是否已登录
4. `admin` 角色或 `isSuper: true` 的角色直接放行
5. 查询用户角色关联的菜单 (RoleMenu)
6. 获取菜单的 authCode
7. 检查是否包含要求的任一权限码

**使用示例:**

```typescript
@Controller('system/user')
@UseGuards(AuthGuard, PermissionGuard)
export class SystemUserController {

    @Get('list')
    @RequirePermission('system:user:list')
    async findAll() { ... }

    @Post()
    @RequirePermission('system:user:create')
    async create(@Body() dto: CreateUserDto) { ... }

    @Delete(':id')
    @RequirePermission('system:user:delete')
    async remove(@Param('id') id: string) { ... }

    // 支持多个权限码（满足任一即可）
    @Get('export')
    @RequirePermission('system:user:list', 'system:user:export')
    async export() { ... }
}
```

## 权限装饰器

### @RequirePermission

**文件位置:** `src/common/decorator/permission.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'require-permission';

export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSION_KEY, permissions);
```

## 守卫选择建议

| 守卫 | 适用场景 | 特点 |
|------|----------|------|
| `AuthGuard` | 所有需要登录的接口 | 基础认证，挂载用户信息 |
| `RoleGuard` | 简单的角色限制 | 基于角色名称，配置简单 |
| `PermissionGuard` | 细粒度权限控制（推荐） | 基于菜单权限码，灵活可配 |

**推荐组合:**
- 普通接口: `@UseGuards(AuthGuard)`
- 系统管理接口: `@UseGuards(AuthGuard, PermissionGuard)` + `@RequirePermission('xxx')`
- 简单角色限制: `@UseGuards(AuthGuard)` + `@UseGuards(RoleGuard(['admin']))`

## 权限码命名规范

权限码采用 `模块:资源:操作` 的格式：

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

## JWT 策略

**文件位置:** `src/modules/auth/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret'),
        });
    }

    async validate(payload: any) {
        const { username, _id } = payload;
        return { username, _id };
    }
}
```

## 认证流程

### 登录流程

1. 客户端向 `POST /api/auth/login` 发送用户名和密码
2. `AuthService` 验证用户并使用 `bcrypt` 比较密码
3. 验证成功后生成 JWT（包含用户ID、用户名、角色）
4. 返回 `accessToken` 给客户端

### 访问受保护资源

1. 客户端在 `Authorization` 头中携带 `Bearer <JWT>`
2. `AuthGuard` 提取并验证 Token
3. 从 Token 载荷获取用户 ID，查询数据库获取完整用户信息
4. 将用户信息挂载到 `request.user`
5. 后续守卫和控制器可直接使用 `req.user`

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
