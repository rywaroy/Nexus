import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/common/modules/prisma';
import { UserStatus } from '@/modules/system/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException({ message: '用户不存在' }, 201);
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new HttpException({ message: '密码错误' }, 201);
    }

    if (user.status === UserStatus.DISABLED) {
      throw new HttpException({ message: '用户已被停用' }, 201);
    }

    // 提取角色名称
    const roles = user.roles.map((ur) => ur.role.name);

    return {
      id: user.id,
      username: user.username,
      roles,
    };
  }

  async createToken(user: any): Promise<string> {
    return this.jwtService.sign(user);
  }

  async logout(): Promise<void> {
    return;
  }
}
