# 自定义装饰器

<!-- AI Context: 本文档描述自定义装饰器，包括 @IsId、@RequirePermission、@Log -->

## @IsId - ID 验证装饰器

**文件位置:** `src/common/decorators/is-id.decorator.ts`

根据 `DATABASE_TYPE` 环境变量自动选择验证方式：
- PostgreSQL/MySQL: 验证 UUID v4 格式
- MongoDB: 验证 ObjectId 格式

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

## @RequirePermission - 权限声明装饰器

**文件位置:** `src/common/decorator/permission.decorator.ts`

声明接口需要的权限码，配合 `PermissionGuard` 使用。

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'require-permission';

export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSION_KEY, permissions);
```

**使用示例:**

```typescript
@Get('list')
@RequirePermission('system:user:list')
async findAll() { ... }

// 多个权限码（满足任一即可）
@Get('export')
@RequirePermission('system:user:list', 'system:user:export')
async export() { ... }
```

## @Log - 操作日志装饰器

**文件位置:** `src/common/decorator/log.decorator.ts`

自动记录操作日志，配合 `LogInterceptor` 使用。

**参数:**

```typescript
interface LogOptions {
    title: string;              // 模块标题
    businessType: BusinessTypeEnum;  // 业务类型
    isSaveRequestData?: boolean;     // 是否保存请求参数（默认 true）
    isSaveResponseData?: boolean;    // 是否保存响应数据（默认 true）
}
```

**业务类型枚举:**

| 值 | 名称 | 描述 |
|----|------|------|
| 0 | OTHER | 其他 |
| 1 | INSERT | 新增 |
| 2 | UPDATE | 修改 |
| 3 | DELETE | 删除 |
| 4 | GRANT | 授权 |
| 5 | EXPORT | 导出 |
| 6 | IMPORT | 导入 |
| 7 | FORCE | 强退 |
| 8 | CLEAN | 清空 |

**使用示例:**

```typescript
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

@Post()
@RequirePermission('system:user:create')
@Log({ title: '用户管理', businessType: BusinessTypeEnum.INSERT })
async create(@Body() dto: CreateUserDto) { ... }

@Put(':id')
@RequirePermission('system:user:update')
@Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE })
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }

// 敏感操作：不保存请求参数
@Put(':id/reset-password')
@Log({
    title: '用户管理',
    businessType: BusinessTypeEnum.UPDATE,
    isSaveRequestData: false  // 不记录密码
})
async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) { ... }
```
