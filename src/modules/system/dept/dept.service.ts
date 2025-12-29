import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';

/**
 * 部门树节点返回格式（对齐前端期望）
 */
export interface DeptTreeNode {
  id: string;
  pid: string | null;
  name: string;
  status: number;
  remark?: string;
  createTime?: string;
  children?: DeptTreeNode[];
}

@Injectable()
export class DeptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建部门
   */
  async create(dto: CreateDeptDto): Promise<DeptTreeNode> {
    const pid = dto.pid ?? null;

    // 校验父级部门
    await this.ensureParentValid(pid);

    // 校验同级名称唯一
    await this.ensureNameUnique(dto.name, pid);

    const created = await this.prisma.dept.create({
      data: {
        name: dto.name,
        pid,
        status: dto.status ?? 0,
        remark: dto.remark,
      },
    });

    return this.toTreeNode(created);
  }

  /**
   * 获取部门树列表
   */
  async findAll(query: QueryDeptDto): Promise<DeptTreeNode[]> {
    const where: any = {};

    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.name) {
      where.name = { contains: query.name };
    }

    const list = await this.prisma.dept.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const nodes = list.map((item) => this.toTreeNode(item));
    return this.buildTree(nodes);
  }

  /**
   * 更新部门
   */
  async update(id: string, dto: UpdateDeptDto): Promise<DeptTreeNode> {
    const dept = await this.prisma.dept.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException('部门不存在');
    }

    // 计算新的父级ID
    const currentPid = dept.pid;
    const nextPid = dto.pid === undefined ? currentPid : (dto.pid ?? null);

    // 校验父级
    if (nextPid) {
      if (nextPid === id) {
        throw new BadRequestException('父级部门不能是自己');
      }
      await this.ensureParentValid(nextPid);
      if (await this.isDescendant(id, nextPid)) {
        throw new BadRequestException('不能将部门移动到其子级下');
      }
    }

    // 校验同级名称唯一
    const newName = dto.name ?? dept.name;
    await this.ensureNameUnique(newName, nextPid, id);

    const updated = await this.prisma.dept.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        remark: dto.remark,
        pid: dto.pid !== undefined ? (dto.pid ?? null) : undefined,
      },
    });

    return this.toTreeNode(updated);
  }

  /**
   * 删除部门
   * 若存在子部门则阻止删除
   */
  async remove(id: string): Promise<{ id: string }> {
    const hasChildren = await this.prisma.dept.count({ where: { pid: id } });
    if (hasChildren > 0) {
      throw new BadRequestException('存在子部门，无法删除');
    }

    const deleted = await this.prisma.dept
      .delete({ where: { id } })
      .catch(() => null);

    if (!deleted) {
      throw new NotFoundException('部门不存在');
    }

    return { id };
  }

  /**
   * 校验父级部门是否存在
   */
  private async ensureParentValid(pid: string | null): Promise<void> {
    if (!pid) return;

    const parent = await this.prisma.dept.findUnique({
      where: { id: pid },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('父级部门不存在');
    }
  }

  /**
   * 校验同级部门名称唯一
   */
  private async ensureNameUnique(
    name: string,
    pid: string | null,
    excludeId?: string,
  ): Promise<void> {
    const where: any = {
      name,
      pid: pid ?? null,
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const exists = await this.prisma.dept.findFirst({ where });

    if (exists) {
      throw new ConflictException('同级部门名称已存在');
    }
  }

  /**
   * 检查 parentId 是否是自身的子级，避免形成环
   */
  private async isDescendant(
    targetId: string,
    parentId: string,
  ): Promise<boolean> {
    let current: string | null = parentId;

    while (current) {
      if (current === targetId) {
        return true;
      }
      const parent = await this.prisma.dept.findUnique({
        where: { id: current },
        select: { pid: true },
      });

      if (!parent || !parent.pid) {
        break;
      }
      current = parent.pid;
    }

    return false;
  }

  /**
   * 构建部门树
   */
  private buildTree(nodes: DeptTreeNode[]): DeptTreeNode[] {
    const map = new Map<string, DeptTreeNode>();
    const roots: DeptTreeNode[] = [];

    // 先将所有节点放入 Map
    for (const node of nodes) {
      map.set(node.id, { ...node });
    }

    // 构建父子关系
    for (const node of map.values()) {
      if (node.pid && map.has(node.pid)) {
        const parent = map.get(node.pid)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // 移除空的 children 数组
    this.pruneEmptyChildren(roots);

    return roots;
  }

  /**
   * 移除空的 children 数组，保持输出简洁
   */
  private pruneEmptyChildren(nodes: DeptTreeNode[]): void {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.pruneEmptyChildren(node.children);
      } else {
        delete node.children;
      }
    }
  }

  /**
   * 将数据库记录转换为前端树节点格式
   */
  private toTreeNode(dept: any): DeptTreeNode {
    return {
      id: dept.id,
      pid: dept.pid || null,
      name: dept.name,
      status: dept.status ?? 0,
      remark: dept.remark || undefined,
      createTime: dept.createdAt
        ? new Date(dept.createdAt).toISOString()
        : undefined,
    };
  }
}
