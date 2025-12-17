import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { BUILTIN_ROLES, Role, RoleDocument } from './entities/role.entity';
import { User } from '../user/entities/user.entity';

/** 默认角色配置 */
const DEFAULT_ROLES = [
  {
    name: 'admin',
    permissions: ['*'],
    remark: '系统内置管理员角色',
    status: 0,
  },
  {
    name: 'user',
    permissions: [],
    remark: '默认用户角色',
    status: 0,
  },
] as const;

/** 角色响应 DTO */
export interface RoleResponseDto {
  id: string;
  name: string;
  permissions: string[];
  remark: string;
  status: number;
  createTime?: string;
}

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<any>,
  ) {}

  /**
   * 将数据库文档转换为响应 DTO
   */
  private toResponseDto(doc: any): RoleResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: obj._id.toString(),
      name: obj.name,
      permissions: obj.permissions || [],
      remark: obj.remark || '',
      status: obj.status,
      createTime: obj.createdAt?.toISOString(),
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
    const exists = await this.roleModel.findOne({ name: dto.name });
    if (exists) {
      throw new ConflictException('角色名称已存在');
    }

    const role = await this.roleModel.create(dto);
    return this.toResponseDto(role);
  }

  /**
   * 分页查询角色列表
   */
  async findAll(query: QueryRoleDto): Promise<{ list: RoleResponseDto[]; total: number }> {
    const { page = 1, pageSize = 10, status, name } = query;
    const filter: FilterQuery<RoleDocument> = {};

    if (status !== undefined) {
      filter.status = status;
    }
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.roleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.roleModel.countDocuments(filter),
    ]);

    return {
      list: list.map((item) => this.toResponseDto(item as any)),
      total,
    };
  }

  /**
   * 根据 ID 查询角色详情
   */
  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleModel.findById(id).lean();
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return this.toResponseDto(role as any);
  }

  /**
   * 根据名称查询角色
   */
  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name });
  }

  /**
   * 根据名称数组查询角色列表
   * 兼容：当用户 roles 存的是角色ID（ObjectId 字符串）时，也能正确查询
   */
  async findByNames(names: string[]): Promise<RoleDocument[]> {
    const normalized = Array.isArray(names)
      ? names
          .filter((v) => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    if (normalized.length === 0) return [];

    const unique = Array.from(new Set(normalized));
    const roleIds = unique
      .filter((v) => Types.ObjectId.isValid(v))
      .map((v) => new Types.ObjectId(v));

    const query: FilterQuery<RoleDocument> =
      roleIds.length > 0
        ? { $or: [{ name: { $in: unique } }, { _id: { $in: roleIds } }] }
        : { name: { $in: unique } };

    return this.roleModel.find(query);
  }

  /**
   * 更新角色
   */
  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 内置角色限制
    if (this.isBuiltinRole(role.name)) {
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
      const exists = await this.roleModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });
      if (exists) {
        throw new ConflictException('角色名称已存在');
      }
    }

    const updated = await this.roleModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
    return this.toResponseDto(updated as any);
  }

  /**
   * 删除角色
   */
  async remove(id: string): Promise<{ id: string }> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 内置角色不允许删除
    if (this.isBuiltinRole(role.name)) {
      throw new BadRequestException('内置角色不允许删除');
    }

    // 检查是否有用户使用该角色
    // 兼容：用户 roles 里可能存的是 role.name 或 role._id
    const roleKeys = [role.name, role._id.toString()];
    const userCount = await this.userModel.countDocuments({
      roles: { $in: roleKeys },
    });
    if (userCount > 0) {
      throw new BadRequestException(
        `该角色已被 ${userCount} 个用户使用，无法删除`,
      );
    }

    await role.deleteOne();
    return { id };
  }

  /**
   * 获取所有角色（用于下拉选择）
   */
  async findAllEnabled(): Promise<RoleResponseDto[]> {
    const roles = await this.roleModel
      .find({ status: 0 })
      .sort({ createdAt: -1 })
      .lean();
    return roles.map((item) => this.toResponseDto(item as any));
  }

  /**
   * 初始化内置角色（应用启动时调用）
   */
  async initBuiltinRoles(): Promise<void> {
    for (const roleConfig of DEFAULT_ROLES) {
      const exists = await this.roleModel.findOne({ name: roleConfig.name });
      if (!exists) {
        await this.roleModel.create(roleConfig);
      }
    }
  }
}
