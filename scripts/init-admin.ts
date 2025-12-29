/**
 * 初始化脚本：创建 admin 用户和 system 菜单
 *
 * 执行方式（需先运行对应数据库的 prisma 脚本）：
 * 1. PostgreSQL: pnpm prisma:postgres && npx ts-node -r tsconfig-paths/register scripts/init-admin.ts
 * 2. MySQL: pnpm prisma:mysql && npx ts-node -r tsconfig-paths/register scripts/init-admin.ts
 * 3. MongoDB: pnpm prisma:mongo && npx ts-node -r tsconfig-paths/register scripts/init-admin.ts
 *
 * 或在 package.json 中添加脚本后执行：
 * npm run init:admin
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// 菜单类型枚举（Prisma 使用大写）
enum MenuType {
  CATALOG = 'CATALOG',
  MENU = 'MENU',
  BUTTON = 'BUTTON',
  EMBEDDED = 'EMBEDDED',
  LINK = 'LINK',
}

// 系统菜单数据
interface MenuData {
  name: string;
  title: string;
  path: string;
  component?: string;
  type: MenuType;
  authCode?: string;
  order?: number;
  icon?: string;
  affixTab?: boolean;
  children?: MenuData[];
}

// Dashboard 菜单数据（所有用户都可以访问）
const DASHBOARD_MENUS: MenuData[] = [
  {
    name: 'Dashboard',
    title: 'page.dashboard.title',
    path: '/dashboard',
    type: MenuType.CATALOG,
    icon: 'lucide:layout-dashboard',
    order: -1,
    children: [
      {
        name: 'Analytics',
        title: 'page.dashboard.analytics',
        path: '/analytics',
        component: 'dashboard/analytics/index',
        type: MenuType.MENU,
        icon: 'lucide:area-chart',
        affixTab: true,
        order: 1,
      },
      {
        name: 'Workspace',
        title: 'page.dashboard.workspace',
        path: '/workspace',
        component: 'dashboard/workspace/index',
        type: MenuType.MENU,
        icon: 'carbon:workspace',
        order: 2,
      },
    ],
  },
];

// 系统管理菜单数据
const SYSTEM_MENUS: MenuData[] = [
  {
    name: 'System',
    title: 'system.title',
    path: '/system',
    type: MenuType.CATALOG,
    icon: 'ion:settings-outline',
    order: 9997,
    children: [
      {
        name: 'SystemMenu',
        title: 'system.menu.title',
        path: 'menu',
        component: 'system/menu/list',
        type: MenuType.MENU,
        icon: 'mdi:menu',
        order: 1,
        children: [
          {
            name: 'SystemMenuList',
            title: 'system.menu.list',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:menu:list',
            order: 1,
          },
          {
            name: 'SystemMenuQuery',
            title: 'system.menu.query',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:menu:query',
            order: 2,
          },
          {
            name: 'SystemMenuCreate',
            title: 'system.menu.create',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:menu:create',
            order: 3,
          },
          {
            name: 'SystemMenuUpdate',
            title: 'system.menu.update',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:menu:update',
            order: 4,
          },
          {
            name: 'SystemMenuDelete',
            title: 'system.menu.delete',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:menu:delete',
            order: 5,
          },
        ],
      },
      {
        name: 'SystemDept',
        title: 'system.dept.title',
        path: 'dept',
        component: 'system/dept/list',
        type: MenuType.MENU,
        icon: 'mdi:file-tree-outline',
        order: 2,
        children: [
          {
            name: 'SystemDeptList',
            title: 'system.dept.list',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:dept:list',
            order: 1,
          },
          {
            name: 'SystemDeptCreate',
            title: 'system.dept.create',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:dept:create',
            order: 2,
          },
          {
            name: 'SystemDeptUpdate',
            title: 'system.dept.update',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:dept:update',
            order: 3,
          },
          {
            name: 'SystemDeptDelete',
            title: 'system.dept.delete',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:dept:delete',
            order: 4,
          },
        ],
      },
      {
        name: 'SystemRole',
        title: 'system.role.title',
        path: 'role',
        component: 'system/role/list',
        type: MenuType.MENU,
        icon: 'mdi:account-group',
        order: 3,
        children: [
          {
            name: 'SystemRoleList',
            title: 'system.role.list',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:role:list',
            order: 1,
          },
          {
            name: 'SystemRoleQuery',
            title: 'system.role.query',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:role:query',
            order: 2,
          },
          {
            name: 'SystemRoleCreate',
            title: 'system.role.create',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:role:create',
            order: 3,
          },
          {
            name: 'SystemRoleUpdate',
            title: 'system.role.update',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:role:update',
            order: 4,
          },
          {
            name: 'SystemRoleDelete',
            title: 'system.role.delete',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:role:delete',
            order: 5,
          },
        ],
      },
      {
        name: 'SystemUser',
        title: 'system.user.title',
        path: 'user',
        component: 'system/user/list',
        type: MenuType.MENU,
        icon: 'mdi:account-outline',
        order: 4,
        children: [
          {
            name: 'SystemUserList',
            title: 'system.user.list',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:list',
            order: 1,
          },
          {
            name: 'SystemUserQuery',
            title: 'system.user.query',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:query',
            order: 2,
          },
          {
            name: 'SystemUserCreate',
            title: 'system.user.create',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:create',
            order: 3,
          },
          {
            name: 'SystemUserUpdate',
            title: 'system.user.update',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:update',
            order: 4,
          },
          {
            name: 'SystemUserDelete',
            title: 'system.user.delete',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:delete',
            order: 5,
          },
          {
            name: 'SystemUserResetPassword',
            title: 'system.user.resetPassword',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:user:reset-password',
            order: 6,
          },
        ],
      },
      {
        name: 'SystemLog',
        title: 'system.log.title',
        path: 'log',
        component: 'system/log/list',
        type: MenuType.MENU,
        icon: 'mdi:clipboard-text-clock-outline',
        order: 5,
        children: [
          {
            name: 'SystemLogList',
            title: 'system.log.list',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:log:list',
            order: 1,
          },
          {
            name: 'SystemLogQuery',
            title: 'system.log.query',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:log:query',
            order: 2,
          },
          {
            name: 'SystemLogDelete',
            title: 'system.log.delete',
            path: '#',
            type: MenuType.BUTTON,
            authCode: 'system:log:delete',
            order: 3,
          },
        ],
      },
    ],
  },
];

// 监控管理菜单数据（保留空数组以备将来扩展）
const MONITOR_MENUS: MenuData[] = [];

// 递归创建菜单
async function createMenus(
  menus: MenuData[],
  parentId: string | null = null,
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const menuData of menus) {
    // 检查菜单是否已存在
    const existing = await prisma.menu.findUnique({
      where: { name: menuData.name },
    });
    if (existing) {
      console.log(`  [跳过] 菜单已存在: ${menuData.name}`);
      createdIds.push(existing.id);

      // 如果有子菜单，继续创建
      if (menuData.children?.length) {
        await createMenus(menuData.children, existing.id);
      }
      continue;
    }

    // 创建菜单
    const menu = await prisma.menu.create({
      data: {
        name: menuData.name,
        title: menuData.title,
        path: menuData.path,
        component: menuData.component,
        type: menuData.type as any,
        authCode: menuData.authCode,
        order: menuData.order ?? 0,
        icon: menuData.icon,
        affixTab: menuData.affixTab ?? false,
        parentId,
        status: 0,
      },
    });

    console.log(`  [创建] 菜单: ${menuData.name} (${menuData.type})`);
    createdIds.push(menu.id);

    // 递归创建子菜单
    if (menuData.children?.length) {
      await createMenus(menuData.children, menu.id);
    }
  }

  return createdIds;
}

// 获取所有菜单 ID（用于给 admin 角色分配权限）
async function getAllMenuIds(): Promise<string[]> {
  const menus = await prisma.menu.findMany({
    select: { id: true },
  });
  return menus.map((m) => m.id);
}

// 主函数
async function main() {
  console.log('\n========================================');
  console.log('       Nexus 初始化脚本 (Prisma)');
  console.log('========================================\n');

  console.log(`[数据库] 使用 Prisma 连接...`);
  console.log(`[提示] 确保已运行正确的 prisma 脚本（如 pnpm prisma:postgres）`);

  try {
    await prisma.$connect();
    console.log('[数据库] 连接成功\n');

    // 1. 创建内置角色（如果不存在）
    console.log('[角色] 检查内置角色...');
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    let adminRoleId: string;

    if (!adminRole) {
      const created = await prisma.role.create({
        data: {
          name: 'admin',
          remark: '系统内置管理员角色',
          status: 0,
          isBuiltin: true,
          isSuper: true, // 超级管理员拥有所有权限
        },
      });
      adminRoleId = created.id;
      console.log('  [创建] admin 角色');
    } else {
      adminRoleId = adminRole.id;
      console.log('  [跳过] admin 角色已存在');
    }

    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) {
      await prisma.role.create({
        data: {
          name: 'user',
          remark: '默认用户角色',
          status: 0,
          isBuiltin: true,
          isSuper: false,
        },
      });
      console.log('  [创建] user 角色');
    } else {
      console.log('  [跳过] user 角色已存在');
    }

    // 2. 创建默认部门
    console.log('\n[部门] 创建默认部门...');
    let defaultDept = await prisma.dept.findFirst({
      where: { name: '总公司', pid: null },
    });
    if (!defaultDept) {
      defaultDept = await prisma.dept.create({
        data: {
          name: '总公司',
          pid: null,
          status: 0,
          remark: '系统默认一级部门',
        },
      });
      console.log('  [创建] 总公司（一级部门）');
    } else {
      console.log('  [跳过] 总公司部门已存在');
    }

    // 3. 创建 Dashboard 菜单（所有用户可访问）
    console.log('\n[菜单] 创建 Dashboard 菜单...');
    await createMenus(DASHBOARD_MENUS);

    // 4. 创建系统菜单
    console.log('\n[菜单] 创建系统菜单...');
    await createMenus(SYSTEM_MENUS);

    // 5. 创建监控管理菜单（如果有的话）
    if (MONITOR_MENUS.length > 0) {
      console.log('\n[菜单] 创建监控管理菜单...');
      await createMenus(MONITOR_MENUS);
    }

    // 6. 更新角色权限（通过 RoleMenu 关联表）
    console.log('\n[角色] 更新角色权限...');
    const allMenuIds = await getAllMenuIds();

    // admin 角色：虽然 isSuper=true 拥有所有权限，但也创建 RoleMenu 关联
    // 先删除旧的关联
    await prisma.roleMenu.deleteMany({
      where: { roleId: adminRoleId },
    });

    // 创建新的关联
    await prisma.roleMenu.createMany({
      data: allMenuIds.map((menuId) => ({
        roleId: adminRoleId,
        menuId,
      })),
    });
    console.log(`  [更新] admin 角色权限（${allMenuIds.length} 个菜单）`);

    // user 角色：无后台权限（C端用户）
    // 保持 RoleMenu 为空

    // 7. 创建 admin 用户
    console.log('\n[用户] 创建管理员用户...');
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: { roles: true },
    });

    if (existingAdmin) {
      // 如果 admin 用户存在但没有部门，则更新部门
      if (!existingAdmin.deptId && defaultDept) {
        await prisma.user.update({
          where: { username: 'admin' },
          data: { deptId: defaultDept.id },
        });
        console.log('  [更新] admin 用户已关联到总公司部门');
      } else {
        console.log('  [跳过] admin 用户已存在');
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          nickName: '超级管理员',
          status: 0,
          deptId: defaultDept.id,
          remark: '系统内置管理员账户',
          roles: {
            create: [{ roleId: adminRoleId }],
          },
        },
      });
      console.log('  [创建] admin 用户');
      console.log('  [信息] 用户名: admin');
      console.log('  [信息] 密码: admin123');
      console.log('  [信息] 所属部门: 总公司');
      console.log('  [警告] 请登录后立即修改默认密码！');
    }

    console.log('\n========================================');
    console.log('       初始化完成');
    console.log('========================================\n');

    // 统计信息
    const menuCount = await prisma.menu.count();
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const deptCount = await prisma.dept.count();

    console.log('[统计]');
    console.log(`  菜单总数: ${menuCount}`);
    console.log(`  用户总数: ${userCount}`);
    console.log(`  角色总数: ${roleCount}`);
    console.log(`  部门总数: ${deptCount}`);
    console.log('');
  } catch (error) {
    console.error('\n[错误] 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('[数据库] 连接已关闭\n');
  }
}

// 执行
main();
