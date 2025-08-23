import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

export function RoleGuard(roles: string[] | string) {
    @Injectable()
    class RoleGuardClass implements CanActivate {
        async canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const userRoles = user.roles;
            if (typeof roles === 'string') {
                roles = [roles];
            }
            const res = roles.some((role) => userRoles.includes(role));
            if (!res) {
                throw new UnauthorizedException('您没有权限访问');
            }
            return true;
        }
    }

    return RoleGuardClass;
}
