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
      const userRoles: string[] = Array.isArray(user?.roles)
        ? user.roles
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
