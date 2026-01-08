# 系统管理模块

<!-- AI Context: 本文档描述系统管理模块，包括菜单、角色、部门和操作日志管理 -->

## 概述

系统管理模块提供完整的后台权限管理功能，采用基于菜单的权限控制体系（RBAC）。

## 权限体系架构

```
┌─────────────────────────────────────┐
│         Menu Entity                 │
├─────────────────────────────────────┤
│ - name (唯一)                       │
│ - parentId (树形)                   │
│ - type (CATALOG/MENU/BUTTON/...)   │
│ - authCode (权限标识)               │
│ - status                            │
└──────────────┬──────────────────────┘
               │
               │ (通过 RoleMenu 关联)
               ▼
    ┌────────────────────────┐
    │   Role Entity          │
    ├────────────────────────┤
    │ - name (唯一)          │
    │ - isSuper (超级管理员) │
    │ - isBuiltin (内置角色) │
    │ - status               │
    │ - menus[] (RoleMenu)   │
    └───────────┬────────────┘
               │
               │ (通过 UserRole 关联)
               ▼
    ┌─────────────────────────┐
    │   User Entity           │
    ├─────────────────────────┤
    │ - username (唯一)       │
    │ - roles[] (UserRole)    │
    │ - deptId (部门ID)       │
    │ - status                │
    └──────────┬──────────────┘
               │
               │ (多对一)
               ▼
    ┌─────────────────────────┐
    │   Dept Entity           │
    ├─────────────────────────┤
    │ - name                  │
    │ - pid (树形)            │
    │ - status                │
    └─────────────────────────┘
```

---

## 菜单管理 (`src/modules/system/menu`)

### 数据模型

```prisma
model Menu {
  id                  String     @id @default(uuid())
  name                String     @unique
  title               String
  parentId            String?
  path                String
  component           String?
  type                MenuType
  authCode            String?
  order               Int        @default(0)
  status              Int        @default(0)
  icon                String?
  activeIcon          String?
  keepAlive           Boolean    @default(false)
  affixTab            Boolean    @default(false)
  hideInMenu          Boolean    @default(false)
  hideChildrenInMenu  Boolean    @default(false)
  hideInBreadcrumb    Boolean    @default(false)
  hideInTab           Boolean    @default(false)
  iframeSrc           String?
  link                String?
  activePath          String?
  badge               String?
  badgeType           BadgeType?
  badgeVariants       BadgeVariants?

  parent              Menu?      @relation("MenuTree", fields: [parentId], references: [id])
  children            Menu[]     @relation("MenuTree")
  roles               RoleMenu[]
}

enum MenuType {
  CATALOG   // 目录
  MENU      // 菜单
  BUTTON    // 按钮
  EMBEDDED  // 内嵌页面
  LINK      // 外链
}
```

### API 接口

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| POST | `/api/menu` | 创建菜单 | system:menu:create |
| GET | `/api/menu/list` | 查询菜单列表（树结构） | system:menu:list |
| GET | `/api/menu/tree` | 获取菜单树（用于选择器） | system:menu:list |
| GET | `/api/menu/routes` | 获取动态路由（需认证） | - |
| GET | `/api/menu/codes` | 获取权限码列表（需认证） | - |
| GET | `/api/menu/:id` | 查询菜单详情 | system:menu:query |
| PUT | `/api/menu/:id` | 更新菜单 | system:menu:update |
| DELETE | `/api/menu/:id` | 删除菜单 | system:menu:delete |

---

## 角色管理 (`src/modules/system/role`)

### 数据模型

```prisma
model Role {
  id        String     @id @default(uuid())
  name      String     @unique
  remark    String     @default("")
  status    Int        @default(0)
  isBuiltin Boolean    @default(false)
  isSuper   Boolean    @default(false)

  users     UserRole[]
  menus     RoleMenu[]
}

model RoleMenu {
  roleId String
  menuId String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menu   Menu   @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@id([roleId, menuId])
}
```

**关键字段:**

| 字段 | 说明 |
|------|------|
| `isBuiltin` | 内置角色不可删除、不可修改名称 |
| `isSuper` | 超级管理员，拥有所有权限 |
| `menus` | 通过 RoleMenu 关联的菜单列表 |

**内置角色:**
- `admin` - 超级管理员，`isSuper: true`
- `user` - 普通用户，默认角色

### API 接口

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/role/list` | 获取角色列表（分页） | system:role:list |
| GET | `/api/system/role/options` | 获取所有启用的角色 | - |
| GET | `/api/system/role/:id` | 获取角色详情 | system:role:query |
| POST | `/api/system/role` | 创建角色 | system:role:create |
| PUT | `/api/system/role/:id` | 更新角色 | system:role:update |
| DELETE | `/api/system/role/:id` | 删除角色 | system:role:delete |

---

## 部门管理 (`src/modules/system/dept`)

### 数据模型

```prisma
model Dept {
  id        String   @id @default(uuid())
  name      String
  pid       String?
  status    Int      @default(0)
  remark    String?

  parent    Dept?    @relation("DeptTree", fields: [pid], references: [id])
  children  Dept[]   @relation("DeptTree")
  users     User[]

  @@unique([pid, name])
}
```

### API 接口

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/dept/list` | 获取部门列表（树形结构） | system:dept:list |
| POST | `/api/system/dept` | 创建部门 | system:dept:create |
| PUT | `/api/system/dept/:id` | 更新部门 | system:dept:update |
| DELETE | `/api/system/dept/:id` | 删除部门 | system:dept:delete |

---

## 操作日志 (`src/modules/system/oper-log`)

### 数据模型

```prisma
model OperLog {
  id            String   @id @default(uuid())
  title         String
  businessType  Int      @default(0)
  method        String?
  requestMethod String?
  operName      String?
  deptName      String?
  operUrl       String?
  operIp        String?
  operLocation  String?
  operParam     String?  @db.Text
  jsonResult    String?  @db.Text
  status        Int      @default(0)
  errorMsg      String?  @db.Text
  operTime      DateTime @default(now())
  costTime      Int      @default(0)
}
```

### API 接口

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/log/list` | 查询操作日志列表（分页） | system:log:list |
| GET | `/api/system/log/:id` | 查询操作日志详情 | system:log:query |
| DELETE | `/api/system/log/clean` | 清空所有操作日志 | system:log:delete |
| DELETE | `/api/system/log/:ids` | 删除操作日志（支持批量） | system:log:delete |

### 使用 @Log 装饰器

```typescript
@Post()
@RequirePermission('system:user:create')
@Log({ title: '用户管理', businessType: BusinessTypeEnum.INSERT })
async create(@Body() dto: CreateUserDto) { ... }

@Put(':id')
@RequirePermission('system:user:update')
@Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE })
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }

// 敏感操作：不保存请求参数
@Put(':id/reset-password')
@Log({
    title: '用户管理',
    businessType: BusinessTypeEnum.UPDATE,
    isSaveRequestData: false
})
async resetPassword(@Param('id') id: string) { ... }
```

---

## 初始化数据

运行 `pnpm init:admin` 会创建以下数据：

**内置角色:**
| 角色名 | 权限 | 说明 |
|--------|------|------|
| `admin` | `isSuper: true` | 超级管理员，拥有所有权限 |
| `user` | 无 | 默认用户角色 |

**默认部门:**
| 部门名称 | 说明 |
|----------|------|
| 总公司 | 系统默认一级部门 |

**管理员账户:**
| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `admin123` |
| 角色 | `admin` |
| 部门 | 总公司 |

> ⚠️ **安全提示**: 请在首次登录后立即修改默认密码！

**系统菜单结构:**

```
Dashboard (仪表盘)
├── Analytics (分析页) - 默认首页
└── Workspace (工作台)

System (系统管理)
├── Menu (菜单管理)
│   ├── system:menu:list
│   ├── system:menu:create
│   ├── system:menu:update
│   └── system:menu:delete
├── Dept (部门管理)
├── Role (角色管理)
├── User (用户管理)
└── Log (操作日志)
```
