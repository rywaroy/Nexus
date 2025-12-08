import { SetMetadata } from '@nestjs/common';

/**
 * 权限声明装饰器元数据 key
 */
export const PERMISSION_KEY = 'require-permission';

/**
 * 权限声明装饰器
 * 用于在 Controller 方法上声明需要的权限码（authCode）
 * 支持传入多个权限码，满足任意一个即通过
 *
 * @example
 * ```typescript
 * @UseGuards(AuthGuard, PermissionGuard)
 * @RequirePermission('system:user:create')
 * @Post()
 * create(@Body() dto: CreateUserDto) { ... }
 *
 * // 多个权限码（满足任一即可）
 * @RequirePermission('system:user:create', 'system:user:update')
 * ```
 */
export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSION_KEY, permissions);
