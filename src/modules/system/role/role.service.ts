import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { filterValidDatabaseIds } from '@/common/utils';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/** 内置角色名称 */
export const BUILTIN_ROLES = ['admin', 'user'] as const;

/** 默认角色配置 */
const DEFAULT_ROLES = [
  {
    name: 'admin',
    remark: '系统内置管理员角色',
    status: 0,
    isBuiltin: true,
    isSuper: true, // 超级管理员拥有所有权限
  },
  {
    name: 'user',
    remark: '默认用户角色',
    status: 0,
    isBuiltin: true,
    isSuper: false,
  },
] as const;

/** 角色响应 DTO */
export interface RoleResponseDto {
  id: string;
  name: string;
  permissions: string[];
  remark: string;
  status: number;
  isBuiltin?: boolean;
  isSuper?: boolean;
  createTime?: string;
}

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 将数据库记录转换为响应 DTO
   */
  private toResponseDto(role: any): RoleResponseDto {
    // 从 RoleMenu 关联中提取 menuId 作为 permissions
    const permissions = role.menus?.map((rm: any) => rm.menuId) || [];

    return {
      id: role.id,
      name: role.name,
      permissions: role.isSuper ? ['*'] : permissions,
      remark: role.remark || '',
      status: role.status,
      isBuiltin: role.isBuiltin,
      isSuper: role.isSuper,
      createTime: role.createdAt?.toISOString(),
    };
  }

  /**
   * 检查是否为内置角色
   */
  private isBuiltinRole(name: string): boolean {
    return BUILTIN_ROLES.includes(name as any);
  }

  /**
   * 创建角色
   */
  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    // 检查名称是否已存在
    const exists = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (exists) {
      throw new ConflictException('角色名称已存在');
    }

    // 处理 permissions -> RoleMenu 关联
    const menuIds = dto.permissions?.filter((p) => p !== '*') || [];

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        remark: dto.remark || '',
        status: dto.status ?? 0,
        isBuiltin: false,
        isSuper: dto.permissions?.includes('*') || false,
        menus:
          menuIds.length > 0
            ? {
                create: menuIds.map((menuId) => ({ menuId })),
              }
            : undefined,
      },
      include: {
        menus: true,
      },
    });

    return this.toResponseDto(role);
  }

  /**
   * 分页查询角色列表
   */
  async findAll(
    query: QueryRoleDto,
  ): Promise<{ list: RoleResponseDto[]; total: number }> {
    const { page = 1, pageSize = 10, status, name } = query;

    const where: any = {};

    if (status !== undefined) {
      where.status = status;
    }
    if (name) {
      where.name = { contains: name };
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          menus: true,
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toResponseDto(item)),
      total,
    };
  }

  /**
   * 根据 ID 查询角色详情
   */
  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        menus: true,
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return this.toResponseDto(role);
  }

  /**
   * 根据名称查询角色
   */
  async findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        menus: true,
      },
    });
  }

  /**
   * 根据名称数组查询角色列表
   */
  async findByNames(names: string[]) {
    const normalized = Array.isArray(names)
      ? names
          .filter((v) => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    if (normalized.length === 0) return [];

    const unique = Array.from(new Set(normalized));

    // 过滤出有效的数据库 ID（兼容 MongoDB ObjectID 和 UUID）
    const validIds = filterValidDatabaseIds(unique);

    // 构建查询条件：name 始终查询，id 只查询有效的数据库 ID
    const orConditions: { name?: { in: string[] }; id?: { in: string[] } }[] = [
      { name: { in: unique } },
    ];
    if (validIds.length > 0) {
      orConditions.push({ id: { in: validIds } });
    }

    return this.prisma.role.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        menus: true,
      },
    });
  }

  /**
   * 更新角色
   */
  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 内置角色限制
    if (role.isBuiltin) {
      // 不允许修改名称
      if (dto.name && dto.name !== role.name) {
        throw new BadRequestException('内置角色不允许修改名称');
      }
      // admin 角色不允许停用
      if (role.name === 'admin' && dto.status === 1) {
        throw new BadRequestException('admin 角色不允许停用');
      }
    }

    // 检查名称是否与其他角色重复
    if (dto.name && dto.name !== role.name) {
      const exists = await this.prisma.role.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException('角色名称已存在');
      }
    }

    // 处理 permissions 更新
    let menusUpdate: any = undefined;
    if (dto.permissions !== undefined) {
      const menuIds = dto.permissions.filter((p) => p !== '*');
      menusUpdate = {
        deleteMany: {},
        create: menuIds.map((menuId) => ({ menuId })),
      };
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        remark: dto.remark,
        status: dto.status,
        isSuper: dto.permissions?.includes('*') ?? role.isSuper,
        menus: menusUpdate,
      },
      include: {
        menus: true,
      },
    });

    return this.toResponseDto(updated);
  }

  /**
   * 删除角色
   */
  async remove(id: string): Promise<{ id: string }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 内置角色不允许删除
    if (role.isBuiltin) {
      throw new BadRequestException('内置角色不允许删除');
    }

    // 检查是否有用户使用该角色
    if (role.users.length > 0) {
      throw new BadRequestException(
        `该角色已被 ${role.users.length} 个用户使用，无法删除`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { id };
  }

  /**
   * 获取所有角色（用于下拉选择）
   */
  async findAllEnabled(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      where: { status: 0 },
      orderBy: { createdAt: 'desc' },
      include: {
        menus: true,
      },
    });

    return roles.map((item) => this.toResponseDto(item));
  }

  /**
   * 初始化内置角色（应用启动时调用）
   */
  async initBuiltinRoles(): Promise<void> {
    for (const roleConfig of DEFAULT_ROLES) {
      const exists = await this.prisma.role.findUnique({
        where: { name: roleConfig.name },
      });

      if (!exists) {
        await this.prisma.role.create({
          data: roleConfig,
        });
      }
    }
  }
}
