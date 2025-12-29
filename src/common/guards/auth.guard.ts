import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from '@/modules/system/user/user.service';
import { UserStatus } from '@/modules/system/user/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userSerivce: UserService,
    private configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let user;
    try {
      const { id } = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
      user = await this.userSerivce.findOne(id);
    } catch {
      throw new UnauthorizedException();
    }
    if (!user || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    request['user'] = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
