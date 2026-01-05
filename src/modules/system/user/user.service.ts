import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/common/modules/prisma';
import {
  CreateUserDto,
  QueryUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from './dto';

/** 用户响应 DTO（用于返回给前端） */
export interface UserResponseDto {
  id: string;
  username: string;
  nickName: string;
  roles: string[];
  postIds: string[];
  email?: string;
  phone?: string;
  avatar?: string;
  status: number;
  deptId?: string;
  remark?: string;
  createTime?: string;
}

/** 用户列表响应 */
export interface UserListResponse {
  list: UserResponseDto[];
  total: number;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建用户（管理员接口）
   */
  create = async (dto: CreateUserDto): Promise<UserResponseDto> => {
    // 唯一性校验
    await this.ensureUnique({
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
    });

    const salt = await bcrypt.genSalt(10);
    const roleNames = this.normalizeRoles(dto.roles);

    // 查找角色
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, salt),
        nickName: dto.nickName,
        email: dto.email || null,
        phone: dto.phone || null,
        avatar: dto.avatar,
        status: dto.status ?? 0,
        deptId: dto.deptId || null,
        remark: dto.remark,
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
          })),
        },
        posts: dto.postIds?.length
          ? {
              create: dto.postIds.map((postId) => ({
                postId,
              })),
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });

    return this.toResponse(created);
  };

  /**
   * 用户注册（公开接口）
   * 强制使用默认角色和启用状态，防止提权
   */
  register = async (dto: RegisterUserDto): Promise<UserResponseDto> => {
    await this.ensureUnique({ username: dto.username });

    const salt = await bcrypt.genSalt(10);

    // 查找默认 user 角色
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'user' },
    });

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        nickName: dto.nickName,
        password: await bcrypt.hash(dto.password, salt),
        status: 0,
        roles: defaultRole
          ? {
              create: [{ roleId: defaultRole.id }],
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });

    return this.toResponse(created);
  };

  /**
   * 分页查询用户列表
   */
  findAll = async (query: QueryUserDto): Promise<UserListResponse> => {
    const {
      page = 1,
      pageSize = 10,
      username,
      nickName,
      phone,
      status,
      deptId,
      postId,
    } = query;

    const where: any = {};

    // 模糊匹配
    if (username) {
      where.username = { contains: username };
    }
    if (nickName) {
      where.nickName = { contains: nickName };
    }
    // 精确匹配
    if (phone) {
      where.phone = phone;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (deptId) {
      where.deptId = deptId;
    }
    // 岗位筛选
    if (postId) {
      where.posts = {
        some: {
          postId,
        },
      };
    }

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          posts: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toResponse(item)),
      total,
    };
  };

  /**
   * 根据ID查询用户详情
   */
  findById = async (id: string): Promise<UserResponseDto> => {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.toResponse(user);
  };

  /**
   * 更新用户信息
   */
  update = async (id: string, dto: UpdateUserDto): Promise<UserResponseDto> => {
    const existed = await this.prisma.user.findUnique({ where: { id } });
    if (!existed) {
      throw new NotFoundException('用户不存在');
    }

    // 唯一性校验（排除自身）
    await this.ensureUnique({
      email: dto.email,
      phone: dto.phone,
      excludeId: id,
    });

    // 处理角色更新
    let rolesUpdate: any = undefined;
    if (dto.roles !== undefined) {
      const roleNames = this.normalizeRoles(dto.roles);
      const roles = await this.prisma.role.findMany({
        where: { name: { in: roleNames } },
      });

      rolesUpdate = {
        deleteMany: {},
        create: roles.map((role) => ({
          roleId: role.id,
        })),
      };
    }

    // 处理岗位更新
    let postsUpdate: any = undefined;
    if (dto.postIds !== undefined) {
      postsUpdate = {
        deleteMany: {},
        create: dto.postIds.map((postId) => ({
          postId,
        })),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        nickName: dto.nickName,
        email: dto.email === '' ? null : dto.email,
        phone: dto.phone === '' ? null : dto.phone,
        avatar: dto.avatar,
        status: dto.status,
        remark: dto.remark,
        deptId: dto.deptId === '' ? null : dto.deptId,
        roles: rolesUpdate,
        posts: postsUpdate,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });

    return this.toResponse(updated);
  };

  /**
   * 删除用户
   */
  remove = async (id: string): Promise<{ id: string }> => {
    const deleted = await this.prisma.user
      .delete({ where: { id } })
      .catch(() => null);
    if (!deleted) {
      throw new NotFoundException('用户不存在');
    }
    return { id };
  };

  /**
   * 更新用户状态
   */
  updateStatus = async (id: string, status: number): Promise<UserResponseDto> => {
    const updated = await this.prisma.user
      .update({
        where: { id },
        data: { status },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          posts: true,
        },
      })
      .catch(() => null);

    if (!updated) {
      throw new NotFoundException('用户不存在');
    }

    return this.toResponse(updated);
  };

  /**
   * 重置用户密码
   */
  resetPassword = async (id: string, password: string): Promise<UserResponseDto> => {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const salt = await bcrypt.genSalt(10);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(password, salt) },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });

    return this.toResponse(updated);
  };

  /**
   * 用户修改自己的密码
   */
  changePassword = async (
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('旧密码错误');
    }

    const salt = await bcrypt.genSalt(10);
    await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(newPassword, salt) },
    });

    return { message: '密码修改成功' };
  };

  /**
   * 内部方法：根据ID查询用户（用于认证守卫）
   */
  findOne = async (id: string) => {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        posts: true,
      },
    });
  };

  /**
   * 角色默认处理：如果未提供或为空，默认赋予 'user' 角色
   */
  private normalizeRoles = (roles?: string[]): string[] => {
    return Array.isArray(roles) && roles.length > 0 ? roles : ['user'];
  };

  /**
   * 将 Prisma 记录转换为前端响应格式
   */
  private toResponse = (user: any): UserResponseDto => {
    const roles = user.roles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];
    const postIds = user.posts?.map((up: any) => up.postId).filter(Boolean) || [];

    return {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      roles,
      postIds,
      email: user.email || undefined,
      phone: user.phone || undefined,
      avatar: user.avatar || undefined,
      status: user.status ?? 0,
      deptId: user.deptId || undefined,
      remark: user.remark || undefined,
      createTime: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    };
  };

  /**
   * 唯一性校验：检查用户名、邮箱、手机号是否已存在
   */
  private ensureUnique = async (params: {
    username?: string;
    email?: string;
    phone?: string;
    excludeId?: string;
  }): Promise<void> => {
    const orConditions: any[] = [];

    if (params.username) {
      orConditions.push({ username: params.username });
    }
    if (params.email) {
      orConditions.push({ email: params.email });
    }
    if (params.phone) {
      orConditions.push({ phone: params.phone });
    }

    if (orConditions.length === 0) return;

    const where: any = { OR: orConditions };

    // 排除自身（用于更新时）
    if (params.excludeId) {
      where.NOT = { id: params.excludeId };
    }

    const existed = await this.prisma.user.findFirst({ where });

    if (!existed) return;

    // 返回具体的冲突字段
    if (params.username && existed.username === params.username) {
      throw new ConflictException('用户名已存在');
    }
    if (params.email && existed.email === params.email) {
      throw new ConflictException('邮箱已存在');
    }
    if (params.phone && existed.phone === params.phone) {
      throw new ConflictException('手机号已存在');
    }

    throw new ConflictException('用户信息已存在');
  };
}
