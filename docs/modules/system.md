# 系统管理模块

<!-- AI Context: 本文档描述系统管理模块，包括菜单、角色、部门、字典和操作日志管理 -->

## 概述

系统管理模块提供完整的后台权限管理功能，采用基于菜单的权限控制体系（RBAC），并包含字典类型/字典数据维护能力。

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

## 字典管理 (`src/modules/system/dict`)

字典管理模块用于维护可复用的枚举型业务数据，拆分为“字典类型”和“字典数据”两层结构。业务侧可通过 `dictType` 直接读取字典项列表，模块内部会结合 Redis 做按类型缓存。

### 数据模型

```prisma
model DictType {
  id        String   @id @default(uuid())
  dictName  String
  dictType  String   @unique
  status    Int      @default(0)
  remark    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  data DictData[]

  @@index([status])
  @@map("dict_types")
}

model DictData {
  id        String   @id @default(uuid())
  typeId    String
  dictLabel String
  dictValue String
  dictSort  Int      @default(0)
  cssClass  String?
  listClass String?
  isDefault Boolean  @default(false)
  status    Int      @default(0)
  remark    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  type DictType @relation(fields: [typeId], references: [id], onDelete: Cascade)

  @@unique([typeId, dictLabel])
  @@index([typeId])
  @@index([status])
  @@index([dictSort])
  @@map("dict_data")
}
```

**关键约束:**

| 约束/字段 | 说明 |
|-----------|------|
| `dictType` | 字典类型编码，全局唯一 |
| `@@unique([typeId, dictLabel])` | 同一字典类型下标签不可重复 |
| `onDelete: Cascade` | 删除字典类型时级联删除其字典数据 |
| `dictSort` | 字典数据排序字段，列表按升序返回 |
| `status` | 状态字段，支持按状态筛选 |

### 请求字段

**字典类型:**

| 字段 | 必填 | 说明 |
|------|------|------|
| `dictName` | 是 | 字典名称 |
| `dictType` | 是 | 字典类型编码 |
| `status` | 否 | 状态，默认 `0` |
| `remark` | 否 | 备注 |

**字典数据:**

| 字段 | 必填 | 说明 |
|------|------|------|
| `typeId` | 是 | 所属字典类型 ID |
| `dictLabel` | 是 | 字典标签 |
| `dictValue` | 是 | 字典键值 |
| `dictSort` | 否 | 排序值，默认 `0` |
| `cssClass` | 否 | 回显样式类 |
| `listClass` | 否 | 列表样式类 |
| `isDefault` | 否 | 是否默认项，默认 `false` |
| `status` | 否 | 状态，默认 `0` |
| `remark` | 否 | 备注 |

### API 接口

#### 字典类型

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/dict/type/list` | 获取字典类型分页列表 | system:dict:list |
| GET | `/api/system/dict/type/options` | 获取字典类型选项列表 | system:dict:query |
| GET | `/api/system/dict/type/:id` | 获取字典类型详情 | system:dict:query |
| POST | `/api/system/dict/type` | 创建字典类型 | system:dict:create |
| PUT | `/api/system/dict/type/:id` | 更新字典类型 | system:dict:update |
| DELETE | `/api/system/dict/type/:id` | 删除字典类型 | system:dict:delete |
| DELETE | `/api/system/dict/cache` | 清空所有字典缓存 | system:dict:update |

列表查询支持 `page`、`pageSize`、`dictName`、`dictType`、`status` 筛选。

#### 字典数据

| 方法 | 路径 | 描述 | 权限码 |
|------|------|------|--------|
| GET | `/api/system/dict/data/list` | 获取字典数据分页列表 | system:dict:query |
| GET | `/api/system/dict/data/type/:dictType` | 根据字典类型获取字典数据列表 | system:dict:query |
| GET | `/api/system/dict/data/:id` | 获取字典数据详情 | system:dict:query |
| POST | `/api/system/dict/data` | 创建字典数据 | system:dict:create |
| PUT | `/api/system/dict/data/:id` | 更新字典数据 | system:dict:update |
| DELETE | `/api/system/dict/data/:id` | 删除字典数据 | system:dict:delete |

列表查询支持 `page`、`pageSize`、`typeId`、`dictType`、`dictLabel`、`status` 筛选。

### 缓存策略

- Redis 键前缀为 `system:dict:<dictType>`。
- `GET /api/system/dict/data/type/:dictType` 采用读穿缓存，命中 Redis 直接返回，未命中则查库并写入缓存。
- 字典类型更新、删除时会清理旧 `dictType` 对应缓存；若修改了 `dictType`，会额外清理新编码对应缓存。
- 字典数据新增、修改、删除时会清理所属字典类型缓存，避免返回旧数据。
- `DELETE /api/system/dict/cache` 会删除所有 `system:dict:*` 键，当前实现返回清理的键数量。
- 字典缓存 TTL 为 `3600` 秒。

### 业务行为说明

- 创建字典类型时，`dictType` 重复会抛出“字典类型已存在”。
- 创建或移动字典数据时，会校验目标字典类型存在，且同一类型下 `dictLabel` 不能重复。
- 删除字典类型会通过数据库外键级联删除其全部字典数据。
- 字典模块已注册到 `AppModule`，接口统一走认证与权限守卫，并通过 `@Log` 记录新增、修改、删除、清缓存操作。

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
│   ├── system:menu:query
│   ├── system:menu:create
│   ├── system:menu:update
│   └── system:menu:delete
├── Dept (部门管理)
│   ├── system:dept:list
│   ├── system:dept:create
│   ├── system:dept:update
│   └── system:dept:delete
├── Post (岗位管理)
│   ├── system:post:list
│   ├── system:post:query
│   ├── system:post:create
│   ├── system:post:update
│   └── system:post:delete
├── Dict (字典管理)
│   ├── system:dict:list
│   ├── system:dict:query
│   ├── system:dict:create
│   ├── system:dict:update
│   └── system:dict:delete
├── Role (角色管理)
│   ├── system:role:list
│   ├── system:role:query
│   ├── system:role:create
│   ├── system:role:update
│   └── system:role:delete
├── User (用户管理)
│   ├── system:user:list
│   ├── system:user:query
│   ├── system:user:create
│   ├── system:user:update
│   ├── system:user:delete
│   └── system:user:reset-password
└── Log (操作日志)
    ├── system:log:list
    ├── system:log:query
    └── system:log:delete
```

> `pnpm init:admin` 会初始化整套系统菜单与权限点；对于字典管理，仅创建菜单/权限定义，不会预置任何字典类型或字典数据。
