import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSION_KEY } from '../decorator/permission.decorator';
import { Menu, MenuDocument } from '../../modules/menu/entities/menu.entity';
import { Role, RoleDocument } from '../../modules/role/entities/role.entity';

/**
 * 权限守卫
 * 基于 authCode 检查用户是否拥有对应权限
 *
 * 使用前必须先通过 AuthGuard 验证用户身份
 *
 * 权限检查逻辑：
 * 1. 如果接口未声明 @RequirePermission，直接放行
 * 2. admin 角色拥有所有权限，直接放行
 * 3. 获取用户所有角色的 permissions（菜单ID数组）
 * 4. 查询这些菜单的 authCode（仅查询启用状态的菜单）
 * 5. 检查是否包含接口要求的权限码
 *
 * 注意：'*' 通配符仅 admin 角色可用，其他角色的 '*' 会被忽略
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectModel(Menu.name)
        private readonly menuModel: Model<MenuDocument>,
        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,
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

        const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

        // admin 角色拥有所有权限
        if (userRoles.includes('admin')) {
            return true;
        }

        // 获取用户所有启用的角色
        const roles = await this.roleModel
            .find({ name: { $in: userRoles }, status: 0 })
            .lean();

        // 收集所有角色的菜单 ID，过滤掉无效的 ObjectId
        const menuIds: Types.ObjectId[] = [];
        for (const role of roles) {
            for (const menuId of role.permissions ?? []) {
                // 忽略 '*' 通配符，仅 admin 角色可使用全部权限
                if (menuId === '*') {
                    continue;
                }
                // 验证是否为有效的 ObjectId
                if (Types.ObjectId.isValid(menuId)) {
                    menuIds.push(new Types.ObjectId(menuId));
                }
            }
        }

        // 没有任何菜单权限
        if (menuIds.length === 0) {
            throw new ForbiddenException('您没有权限访问此资源');
        }

        // 查询启用状态菜单的 authCode
        const menus = await this.menuModel
            .find({
                _id: { $in: menuIds },
                status: 0, // 仅查询启用状态的菜单
            })
            .select('authCode')
            .lean();

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
