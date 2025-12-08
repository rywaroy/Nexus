import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import {
    CreateUserDto,
    QueryUserDto,
    RegisterUserDto,
    UpdateUserDto,
} from './dto';
import { User, UserDocument } from './entities/user.entity';

/** 用户响应 DTO（用于返回给前端） */
export interface UserResponseDto {
    id: string;
    username: string;
    nickName: string;
    roles: string[];
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
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {}

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
        const roles = this.normalizeRoles(dto.roles);

        const created = await this.userModel.create({
            ...dto,
            roles,
            password: await bcrypt.hash(dto.password, salt),
            deptId: dto.deptId ? new Types.ObjectId(dto.deptId) : undefined,
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

        const created = await this.userModel.create({
            username: dto.username,
            nickName: dto.nickName,
            password: await bcrypt.hash(dto.password, salt),
            roles: ['user'],
            status: 0,
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
        } = query;

        const filter: FilterQuery<UserDocument> = {};

        // 模糊匹配
        if (username) {
            filter.username = { $regex: username, $options: 'i' };
        }
        if (nickName) {
            filter.nickName = { $regex: nickName, $options: 'i' };
        }
        // 精确匹配
        if (phone) {
            filter.phone = phone;
        }
        if (status !== undefined) {
            filter.status = status;
        }
        if (deptId && Types.ObjectId.isValid(deptId)) {
            filter.deptId = new Types.ObjectId(deptId);
        }

        const skip = (page - 1) * pageSize;

        const [list, total] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .select('-password')
                .lean(),
            this.userModel.countDocuments(filter),
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
        const user = await this.userModel
            .findById(id)
            .select('-password')
            .lean();

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return this.toResponse(user);
    };

    /**
     * 更新用户信息
     */
    update = async (id: string, dto: UpdateUserDto): Promise<UserResponseDto> => {
        const existed = await this.userModel.findById(id);
        if (!existed) {
            throw new NotFoundException('用户不存在');
        }

        // 唯一性校验（排除自身）
        await this.ensureUnique({
            email: dto.email,
            phone: dto.phone,
            excludeId: id,
        });

        const updateData: Partial<User> = {};

        if (dto.nickName !== undefined) updateData.nickName = dto.nickName;
        if (dto.email !== undefined) updateData.email = dto.email || undefined;
        if (dto.phone !== undefined) updateData.phone = dto.phone || undefined;
        if (dto.avatar !== undefined) updateData.avatar = dto.avatar;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.remark !== undefined) updateData.remark = dto.remark;
        if (dto.roles !== undefined) updateData.roles = this.normalizeRoles(dto.roles);
        if (dto.deptId !== undefined) {
            updateData.deptId = dto.deptId
                ? new Types.ObjectId(dto.deptId)
                : undefined;
        }

        const updated = await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .select('-password');

        if (!updated) {
            throw new NotFoundException('用户不存在');
        }

        return this.toResponse(updated);
    };

    /**
     * 删除用户
     */
    remove = async (id: string): Promise<{ id: string }> => {
        const deleted = await this.userModel.findByIdAndDelete(id);
        if (!deleted) {
            throw new NotFoundException('用户不存在');
        }
        return { id };
    };

    /**
     * 更新用户状态
     */
    updateStatus = async (id: string, status: number): Promise<UserResponseDto> => {
        const updated = await this.userModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .select('-password');

        if (!updated) {
            throw new NotFoundException('用户不存在');
        }

        return this.toResponse(updated);
    };

    /**
     * 重置用户密码
     */
    resetPassword = async (id: string, password: string): Promise<UserResponseDto> => {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        return this.toResponse(user);
    };

    /**
     * 内部方法：根据ID查询用户（用于认证守卫）
     * 返回完整的 UserDocument，不排除密码
     */
    findOne = (id: string): Promise<UserDocument> => {
        return this.userModel.findById(id).select('-password').exec();
    };

    /**
     * 角色默认处理：如果未提供或为空，默认赋予 'user' 角色
     */
    private normalizeRoles = (roles?: string[]): string[] => {
        return Array.isArray(roles) && roles.length > 0 ? roles : ['user'];
    };

    /**
     * 将 MongoDB 文档转换为前端响应格式
     */
    private toResponse = (doc: UserDocument | any): UserResponseDto => {
        const obj = doc.toObject ? doc.toObject() : doc;
        return {
            id: obj._id?.toString(),
            username: obj.username,
            nickName: obj.nickName,
            roles: Array.isArray(obj.roles) ? obj.roles : [],
            email: obj.email,
            phone: obj.phone,
            avatar: obj.avatar,
            status: obj.status ?? 0,
            deptId: obj.deptId?.toString(),
            remark: obj.remark,
            createTime: obj.createdAt
                ? new Date(obj.createdAt).toISOString()
                : undefined,
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
        const orConditions: FilterQuery<UserDocument>[] = [];

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

        const filter: FilterQuery<UserDocument> = { $or: orConditions };

        // 排除自身（用于更新时）
        if (params.excludeId) {
            filter._id = { $ne: new Types.ObjectId(params.excludeId) };
        }

        const existed = await this.userModel.findOne(filter).lean();

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
