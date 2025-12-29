import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { MenuType } from './entities/menu.entity';
import {
  DynamicRouteNode,
  MenuNode,
  MenuTreeNode,
} from './types/menu.types';
import { RoleService } from '../role/role.service';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
  ) {}

  /**
   * 创建菜单
   */
  async create(createMenuDto: CreateMenuDto) {
    // 检查名称是否重复
    const exists = await this.prisma.menu.findUnique({
      where: { name: createMenuDto.name },
    });
    if (exists) {
      throw new ConflictException('菜单名称已存在');
    }

    // 检查父级菜单是否存在
    if (createMenuDto.parentId) {
      const parent = await this.prisma.menu.findUnique({
        where: { id: createMenuDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('父级菜单不存在');
      }
    }

    // 转换 MenuType 枚举
    const typeMap: Record<string, string> = {
      catalog: 'CATALOG',
      menu: 'MENU',
      button: 'BUTTON',
      embedded: 'EMBEDDED',
      link: 'LINK',
    };

    const badgeTypeMap: Record<string, string> = {
      dot: 'DOT',
      normal: 'NORMAL',
    };

    const badgeVariantsMap: Record<string, string> = {
      default: 'DEFAULT',
      destructive: 'DESTRUCTIVE',
      primary: 'PRIMARY',
      success: 'SUCCESS',
      warning: 'WARNING',
    };

    return this.prisma.menu.create({
      data: {
        name: createMenuDto.name,
        title: createMenuDto.title,
        parentId: createMenuDto.parentId || null,
        path: createMenuDto.path,
        component: createMenuDto.component,
        type: typeMap[createMenuDto.type] as any,
        authCode: createMenuDto.authCode,
        order: createMenuDto.order ?? 0,
        status: createMenuDto.status ?? 0,
        icon: createMenuDto.icon,
        activeIcon: createMenuDto.activeIcon,
        keepAlive: createMenuDto.keepAlive ?? false,
        affixTab: createMenuDto.affixTab ?? false,
        hideInMenu: createMenuDto.hideInMenu ?? false,
        hideChildrenInMenu: createMenuDto.hideChildrenInMenu ?? false,
        hideInBreadcrumb: createMenuDto.hideInBreadcrumb ?? false,
        hideInTab: createMenuDto.hideInTab ?? false,
        iframeSrc: createMenuDto.iframeSrc,
        link: createMenuDto.link,
        activePath: createMenuDto.activePath,
        badge: createMenuDto.badge,
        badgeType: createMenuDto.badgeType
          ? (badgeTypeMap[createMenuDto.badgeType] as any)
          : null,
        badgeVariants: createMenuDto.badgeVariants
          ? (badgeVariantsMap[createMenuDto.badgeVariants] as any)
          : null,
      },
    });
  }

  /**
   * 查询菜单列表（返回树结构，统一格式）
   */
  async findAll(query: QueryMenuDto): Promise<MenuTreeNode[]> {
    const where = this.buildFilter(query);
    const menus = await this.prisma.menu.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const nodes = menus.map((menu) => this.mapToMenuNode(menu));
    return this.buildTree(nodes);
  }

  /**
   * 根据 ID 查询菜单详情
   */
  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    return menu;
  }

  /**
   * 更新菜单
   */
  async update(id: string, updateMenuDto: UpdateMenuDto) {
    // 检查菜单是否存在
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }

    // 检查名称是否与其他菜单重复
    if (updateMenuDto.name && updateMenuDto.name !== menu.name) {
      const exists = await this.prisma.menu.findFirst({
        where: {
          name: updateMenuDto.name,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException('菜单名称已存在');
      }
    }

    // 检查父级菜单是否存在且不能设置为自己或自己的子级
    if (updateMenuDto.parentId) {
      if (updateMenuDto.parentId === id) {
        throw new BadRequestException('父级菜单不能是自己');
      }
      const parent = await this.prisma.menu.findUnique({
        where: { id: updateMenuDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('父级菜单不存在');
      }
      // 检查是否会形成循环引用
      if (await this.isDescendant(id, updateMenuDto.parentId)) {
        throw new BadRequestException('不能将菜单移动到其子级下');
      }
    }

    // 转换枚举
    const typeMap: Record<string, string> = {
      catalog: 'CATALOG',
      menu: 'MENU',
      button: 'BUTTON',
      embedded: 'EMBEDDED',
      link: 'LINK',
    };

    const badgeTypeMap: Record<string, string> = {
      dot: 'DOT',
      normal: 'NORMAL',
    };

    const badgeVariantsMap: Record<string, string> = {
      default: 'DEFAULT',
      destructive: 'DESTRUCTIVE',
      primary: 'PRIMARY',
      success: 'SUCCESS',
      warning: 'WARNING',
    };

    return this.prisma.menu.update({
      where: { id },
      data: {
        name: updateMenuDto.name,
        title: updateMenuDto.title,
        parentId:
          updateMenuDto.parentId !== undefined
            ? updateMenuDto.parentId || null
            : undefined,
        path: updateMenuDto.path,
        component: updateMenuDto.component,
        type: updateMenuDto.type ? (typeMap[updateMenuDto.type] as any) : undefined,
        authCode: updateMenuDto.authCode,
        order: updateMenuDto.order,
        status: updateMenuDto.status,
        icon: updateMenuDto.icon,
        activeIcon: updateMenuDto.activeIcon,
        keepAlive: updateMenuDto.keepAlive,
        affixTab: updateMenuDto.affixTab,
        hideInMenu: updateMenuDto.hideInMenu,
        hideChildrenInMenu: updateMenuDto.hideChildrenInMenu,
        hideInBreadcrumb: updateMenuDto.hideInBreadcrumb,
        hideInTab: updateMenuDto.hideInTab,
        iframeSrc: updateMenuDto.iframeSrc,
        link: updateMenuDto.link,
        activePath: updateMenuDto.activePath,
        badge: updateMenuDto.badge,
        badgeType: updateMenuDto.badgeType
          ? (badgeTypeMap[updateMenuDto.badgeType] as any)
          : undefined,
        badgeVariants: updateMenuDto.badgeVariants
          ? (badgeVariantsMap[updateMenuDto.badgeVariants] as any)
          : undefined,
      },
    });
  }

  /**
   * 删除菜单
   */
  async delete(id: string): Promise<void> {
    // 检查是否存在子菜单
    const hasChildren = await this.prisma.menu.count({
      where: { parentId: id },
    });
    if (hasChildren > 0) {
      throw new BadRequestException('存在子菜单，无法删除');
    }

    const result = await this.prisma.menu
      .delete({ where: { id } })
      .catch(() => null);

    if (!result) {
      throw new NotFoundException('菜单不存在');
    }
  }

  /**
   * 获取菜单树（用于选择器，只返回启用的菜单）
   */
  async getMenuTree(): Promise<MenuTreeNode[]> {
    const menus = await this.prisma.menu.findMany({
      where: { status: 0 },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const nodes = menus.map((menu) => this.mapToMenuNode(menu));
    return this.buildTree(nodes);
  }

  /**
   * 获取动态路由（转换为前端 RouteRecordStringComponent 格式）
   * 排除按钮类型，只返回启用的菜单
   */
  async getRoutes(): Promise<DynamicRouteNode[]> {
    const menus = await this.prisma.menu.findMany({
      where: { status: 0, type: { not: 'BUTTON' } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const nodes = menus.map((menu) => this.mapToRouteNode(menu));
    return this.buildRouteTree(nodes, menus);
  }

  /**
   * 根据用户角色获取动态路由
   * admin 角色拥有所有权限，其他角色根据 permissions 过滤
   */
  async getRoutesByRoles(userRoles: string[]): Promise<DynamicRouteNode[]> {
    // admin 角色拥有所有权限
    if (userRoles.includes('admin')) {
      return this.getRoutes();
    }

    // 获取用户所有角色的权限（菜单ID列表）
    const roles = await this.roleService.findByNames(userRoles);
    const allowedMenuIds = new Set<string>();

    for (const role of roles) {
      // 跳过停用的角色
      if (role.status === 1) continue;

      // 检查是否为超级管理员
      if (role.isSuper) {
        return this.getRoutes();
      }

      // 从 RoleMenu 关联中获取菜单ID
      for (const rm of role.menus ?? []) {
        allowedMenuIds.add(rm.menuId);
      }
    }

    // 如果没有任何权限，返回空数组
    if (allowedMenuIds.size === 0) {
      return [];
    }

    // 获取允许的菜单及其所有父级菜单（确保树结构完整）
    const allMenuIds = await this.getMenuIdsWithAncestors(
      Array.from(allowedMenuIds),
    );

    // 查询菜单（父级菜单即使停用也要包含，以保证树结构完整）
    // 但按钮类型不需要
    const menus = await this.prisma.menu.findMany({
      where: {
        id: { in: allMenuIds },
        type: { not: 'BUTTON' },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const nodes = menus.map((menu) => this.mapToRouteNode(menu));
    return this.buildRouteTree(nodes, menus);
  }

  /**
   * 获取菜单ID及其所有祖先菜单ID（批量优化版本）
   */
  private async getMenuIdsWithAncestors(menuIds: string[]): Promise<string[]> {
    const allIds = new Set<string>(menuIds);

    // 批量获取所有相关菜单
    const menusToCheck = await this.prisma.menu.findMany({
      where: { id: { in: menuIds } },
      select: { id: true, parentId: true },
    });

    // 收集所有父级ID
    const parentIds = new Set<string>();
    for (const menu of menusToCheck) {
      if (menu.parentId) {
        parentIds.add(menu.parentId);
      }
    }

    // 递归获取更上层的父级
    while (parentIds.size > 0) {
      const newParentIds: string[] = [];

      for (const pid of parentIds) {
        if (!allIds.has(pid)) {
          allIds.add(pid);
          newParentIds.push(pid);
        }
      }

      if (newParentIds.length === 0) break;

      // 批量查询这些父级的父级
      const parentMenus = await this.prisma.menu.findMany({
        where: { id: { in: newParentIds } },
        select: { id: true, parentId: true },
      });

      parentIds.clear();
      for (const menu of parentMenus) {
        if (menu.parentId) {
          if (!allIds.has(menu.parentId)) {
            parentIds.add(menu.parentId);
          }
        }
      }
    }

    return Array.from(allIds);
  }

  /**
   * 根据用户角色获取权限码列表
   */
  async getAccessCodesByRoles(userRoles: string[]): Promise<string[]> {
    // admin 角色拥有所有权限
    if (userRoles.includes('admin')) {
      return this.getAllAccessCodes();
    }

    // 获取用户所有角色的权限（菜单ID列表）
    const roles = await this.roleService.findByNames(userRoles);
    const allowedMenuIds = new Set<string>();

    for (const role of roles) {
      // 跳过停用的角色
      if (role.status === 1) continue;

      // 检查是否为超级管理员
      if (role.isSuper) {
        return this.getAllAccessCodes();
      }

      // 从 RoleMenu 关联中获取菜单ID
      for (const rm of role.menus ?? []) {
        allowedMenuIds.add(rm.menuId);
      }
    }

    // 如果没有任何权限，返回空数组
    if (allowedMenuIds.size === 0) {
      return [];
    }

    // 查询这些菜单的 authCode（仅启用状态的按钮类型）
    const menus = await this.prisma.menu.findMany({
      where: {
        id: { in: Array.from(allowedMenuIds) },
        status: 0,
        authCode: { not: null },
      },
      select: { authCode: true },
    });

    return menus
      .map((menu) => menu.authCode)
      .filter((code): code is string => Boolean(code));
  }

  /**
   * 获取所有启用状态的权限码
   */
  private async getAllAccessCodes(): Promise<string[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        status: 0,
        authCode: { not: null },
      },
      select: { authCode: true },
    });

    return menus
      .map((menu) => menu.authCode)
      .filter((code): code is string => Boolean(code));
  }

  /**
   * 构建查询过滤条件
   */
  private buildFilter(query: QueryMenuDto): any {
    const filter: any = {};

    if (query.name) {
      filter.name = { contains: query.name };
    }
    if (query.title) {
      filter.title = { contains: query.title };
    }
    if (query.status !== undefined) {
      filter.status = query.status;
    }
    if (query.type) {
      const typeMap: Record<string, string> = {
        catalog: 'CATALOG',
        menu: 'MENU',
        button: 'BUTTON',
        embedded: 'EMBEDDED',
        link: 'LINK',
      };
      filter.type = typeMap[query.type];
    }
    if (query.parentId) {
      filter.parentId = query.parentId;
    }

    return filter;
  }

  /**
   * 将数据库菜单转换为统一的 MenuNode 格式
   */
  private mapToMenuNode(menu: any): MenuNode {
    // 枚举值转换回小写
    const typeMap: Record<string, MenuType> = {
      CATALOG: MenuType.CATALOG,
      MENU: MenuType.MENU,
      BUTTON: MenuType.BUTTON,
      EMBEDDED: MenuType.EMBEDDED,
      LINK: MenuType.LINK,
    };

    const badgeTypeMap: Record<string, string> = {
      DOT: 'dot',
      NORMAL: 'normal',
    };

    const badgeVariantsMap: Record<string, string> = {
      DEFAULT: 'default',
      DESTRUCTIVE: 'destructive',
      PRIMARY: 'primary',
      SUCCESS: 'success',
      WARNING: 'warning',
    };

    const menuType = typeMap[menu.type] || MenuType.MENU;

    // 按钮类型只需要基本字段和 title
    if (menuType === MenuType.BUTTON) {
      return {
        id: menu.id,
        pid: menu.parentId || null,
        name: menu.name,
        type: menuType,
        status: menu.status ?? 0,
        authCode: menu.authCode,
        meta: {
          title: menu.title,
        },
      } as MenuNode;
    }

    // 其他类型返回完整结构
    return {
      id: menu.id,
      pid: menu.parentId || null,
      name: menu.name,
      path: menu.path,
      component: menu.component,
      type: menuType,
      status: menu.status ?? 0,
      authCode: menu.authCode,
      meta: {
        title: menu.title,
        icon: menu.icon,
        activeIcon: menu.activeIcon,
        keepAlive: menu.keepAlive ?? false,
        affixTab: menu.affixTab ?? false,
        hideInMenu: menu.hideInMenu ?? false,
        hideChildrenInMenu: menu.hideChildrenInMenu ?? false,
        hideInBreadcrumb: menu.hideInBreadcrumb ?? false,
        hideInTab: menu.hideInTab ?? false,
        badge: menu.badge,
        badgeType: menu.badgeType ? badgeTypeMap[menu.badgeType] : undefined,
        badgeVariants: menu.badgeVariants
          ? badgeVariantsMap[menu.badgeVariants]
          : undefined,
        iframeSrc: menu.iframeSrc,
        link: menu.link,
        activePath: menu.activePath,
        order: menu.order ?? 0,
      },
      children: [],
    };
  }

  /**
   * 构建树结构
   */
  private buildTree(nodes: MenuNode[]): MenuNode[] {
    const map = new Map<string, MenuNode>();
    const roots: MenuNode[] = [];

    // 先将所有节点放入 Map
    nodes.forEach((node) => {
      map.set(node.id, { ...node, children: [] });
    });

    // 构建树结构
    map.forEach((node) => {
      if (node.pid && map.has(node.pid)) {
        map.get(node.pid)?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 排序
    this.sortTree(roots);
    return roots;
  }

  /**
   * 递归排序菜单树
   */
  private sortTree(nodes: MenuNode[]): void {
    nodes.sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        this.sortTree(node.children);
      }
    });
  }

  /**
   * 将数据库菜单转换为动态路由节点格式
   */
  private mapToRouteNode(
    menu: any,
  ): DynamicRouteNode & { _id: string; _pid: string | null } {
    const badgeTypeMap: Record<string, string> = {
      DOT: 'dot',
      NORMAL: 'normal',
    };

    const badgeVariantsMap: Record<string, string> = {
      DEFAULT: 'default',
      DESTRUCTIVE: 'destructive',
      PRIMARY: 'primary',
      SUCCESS: 'success',
      WARNING: 'warning',
    };

    const node: DynamicRouteNode & { _id: string; _pid: string | null } = {
      _id: menu.id,
      _pid: menu.parentId || null,
      name: menu.name,
      path: menu.path,
      meta: {
        title: menu.title,
        icon: menu.icon,
        activeIcon: menu.activeIcon,
        keepAlive: menu.keepAlive ?? false,
        affixTab: menu.affixTab ?? false,
        hideInMenu: menu.hideInMenu ?? false,
        hideChildrenInMenu: menu.hideChildrenInMenu ?? false,
        hideInBreadcrumb: menu.hideInBreadcrumb ?? false,
        hideInTab: menu.hideInTab ?? false,
        badge: menu.badge,
        badgeType: menu.badgeType ? badgeTypeMap[menu.badgeType] : undefined,
        badgeVariants: menu.badgeVariants
          ? badgeVariantsMap[menu.badgeVariants]
          : undefined,
        iframeSrc: menu.iframeSrc,
        link: menu.link,
        activePath: menu.activePath,
        order: menu.order ?? 0,
      },
    };

    // 只有 menu 类型才有 component
    if (menu.type === 'MENU' && menu.component) {
      node.component = menu.component;
    }

    return node;
  }

  /**
   * 构建动态路由树结构
   */
  private buildRouteTree(
    nodes: (DynamicRouteNode & { _id: string; _pid: string | null })[],
    _rawMenus: any[],
  ): DynamicRouteNode[] {
    const map = new Map<
      string,
      DynamicRouteNode & { _id: string; _pid: string | null }
    >();
    const roots: DynamicRouteNode[] = [];

    // 先将所有节点放入 Map
    nodes.forEach((node) => {
      map.set(node._id, { ...node, children: [] });
    });

    // 构建树结构
    map.forEach((node) => {
      // 清理临时字段
      const cleanNode = this.cleanRouteNode(node);

      if (node._pid && map.has(node._pid)) {
        const parent = map.get(node._pid)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(cleanNode);
      } else {
        roots.push(cleanNode);
      }
    });

    // 排序并设置 redirect
    this.sortRouteTree(roots);
    this.setRedirects(roots);

    return roots;
  }

  /**
   * 清理路由节点的临时字段
   */
  private cleanRouteNode(
    node: DynamicRouteNode & { _id: string; _pid: string | null },
  ): DynamicRouteNode {
    const { _id, _pid, ...cleanNode } = node;
    return cleanNode;
  }

  /**
   * 递归排序路由树
   */
  private sortRouteTree(nodes: DynamicRouteNode[]): void {
    nodes.sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        this.sortRouteTree(node.children);
      }
    });
  }

  /**
   * 为目录类型节点设置 redirect 到第一个子节点
   */
  private setRedirects(nodes: DynamicRouteNode[]): void {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        // 如果没有 component，说明是目录类型，需要设置 redirect
        if (!node.component) {
          node.redirect = node.children[0].path;
        }
        this.setRedirects(node.children);
      }
    });
  }

  /**
   * 检查 targetId 是否是 ancestorId 的后代
   */
  private async isDescendant(
    ancestorId: string,
    targetId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    let currentId = targetId;

    while (currentId) {
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);

      if (currentId === ancestorId) {
        return true;
      }

      const menu = await this.prisma.menu.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!menu || !menu.parentId) {
        break;
      }
      currentId = menu.parentId;
    }

    return false;
  }

  /**
   * 检查菜单名称是否存在
   */
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const where: any = { name };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await this.prisma.menu.count({ where });
    return count > 0;
  }

  /**
   * 检查路由路径是否存在
   */
  async checkPathExists(path: string, excludeId?: string): Promise<boolean> {
    const where: any = { path };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await this.prisma.menu.count({ where });
    return count > 0;
  }
}
