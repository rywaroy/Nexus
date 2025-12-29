import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export function RoleGuard(roles: string[] | string) {
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];

  @Injectable()
  class RoleGuardClass implements CanActivate {
    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      // 从 Prisma 关联对象中提取角色名称
      const userRoles: string[] = Array.isArray(user?.roles)
        ? user.roles.map((ur: any) => ur.role?.name).filter(Boolean)
        : [];

      // admin 拥有所有权限
      if (userRoles.includes('admin')) {
        return true;
      }

      const res = normalizedRoles.some((role) =>
        userRoles.includes(role),
      );
      if (!res) {
        throw new UnauthorizedException('您没有权限访问');
      }
      return true;
    }
  }

  return RoleGuardClass;
}
