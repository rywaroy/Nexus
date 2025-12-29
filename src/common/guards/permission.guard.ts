import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/common/modules/prisma';
import { filterValidDatabaseIds } from '@/common/utils';
import { PERMISSION_KEY } from '../decorator/permission.decorator';

/**
 * 权限守卫
 * 基于 authCode 检查用户是否拥有对应权限
 *
 * 使用前必须先通过 AuthGuard 验证用户身份
 *
 * 权限检查逻辑：
 * 1. 如果接口未声明 @RequirePermission，直接放行
 * 2. admin 角色或 isSuper 角色拥有所有权限，直接放行
 * 3. 获取用户所有角色的 RoleMenu 关联（菜单ID数组）
 * 4. 查询这些菜单的 authCode（仅查询启用状态的菜单）
 * 5. 检查是否包含接口要求的权限码
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取接口声明的权限码
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 未声明权限码则直接放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 未登录用户应返回 401，表示需要认证
    // 注意：此 Guard 应与 AuthGuard 配合使用，正常情况下 user 不会为空
    if (!user) {
      throw new UnauthorizedException('请先登录');
    }

    // 从 Prisma 关联对象中提取角色名称
    // user.roles 结构: [{ roleId, role: { name: 'admin' } }, ...]
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles.map((ur: any) => ur.role?.name).filter(Boolean)
      : [];

    // 获取用户所有启用的角色
    const normalizedRoleKeys = userRoles
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    // admin 角色名称直接放行
    if (normalizedRoleKeys.includes('admin')) {
      return true;
    }

    if (normalizedRoleKeys.length === 0) {
      throw new ForbiddenException('您没有权限访问此资源');
    }

    // 查询用户拥有的启用状态角色（支持角色名或角色ID）
    const validIds = filterValidDatabaseIds(normalizedRoleKeys);
    const orConditions: { name?: { in: string[] }; id?: { in: string[] } }[] = [
      { name: { in: normalizedRoleKeys } },
    ];
    if (validIds.length > 0) {
      orConditions.push({ id: { in: validIds } });
    }

    const roles = await this.prisma.role.findMany({
      where: {
        status: 0,
        OR: orConditions,
      },
      include: {
        menus: true,
      },
    });

    // 检查是否有超级管理员角色
    if (roles.some((role) => role.isSuper || role.name === 'admin')) {
      return true;
    }

    // 收集所有角色的菜单 ID
    const menuIds = new Set<string>();
    for (const role of roles) {
      for (const rm of role.menus ?? []) {
        menuIds.add(rm.menuId);
      }
    }

    // 没有任何菜单权限
    if (menuIds.size === 0) {
      throw new ForbiddenException('您没有权限访问此资源');
    }

    // 查询启用状态菜单的 authCode
    const menus = await this.prisma.menu.findMany({
      where: {
        id: { in: Array.from(menuIds) },
        status: 0, // 仅查询启用状态的菜单
      },
      select: { authCode: true },
    });

    const ownedAuthCodes = new Set<string>();
    for (const menu of menus) {
      if (menu.authCode) {
        ownedAuthCodes.add(menu.authCode);
      }
    }

    // 检查是否包含要求的任一权限码
    const hasPermission = requiredPermissions.some((code) =>
      ownedAuthCodes.has(code),
    );

    if (!hasPermission) {
      throw new ForbiddenException('您没有权限访问此资源');
    }

    return true;
  }
}
