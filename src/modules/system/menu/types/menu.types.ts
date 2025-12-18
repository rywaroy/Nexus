import { MenuType } from '../entities/menu.entity';

/** 菜单 meta 信息 */
export interface MenuMeta {
  title: string;
  icon?: string;
  activeIcon?: string;
  keepAlive?: boolean;
  affixTab?: boolean;
  hideInMenu?: boolean;
  hideChildrenInMenu?: boolean;
  hideInBreadcrumb?: boolean;
  hideInTab?: boolean;
  badge?: string;
  badgeType?: string;
  badgeVariants?: string;
  iframeSrc?: string;
  link?: string;
  activePath?: string;
  order?: number;
}

/** 菜单节点（用于菜单管理列表） */
export interface MenuNode {
  id: string;
  pid: string | null;
  name: string;
  path?: string;
  component?: string;
  type: MenuType;
  authCode?: string;
  status: number;
  meta: Partial<MenuMeta> & { title: string };
  children?: MenuNode[];
}

/** 菜单树节点（别名，用于兼容） */
export type MenuTreeNode = MenuNode;

/**
 * 动态路由节点（符合 vben RouteRecordStringComponent 格式）
 * 用于前端动态路由加载
 */
export interface DynamicRouteNode {
  name: string;
  path: string;
  component?: string;
  redirect?: string;
  meta: Partial<MenuMeta> & { title: string };
  children?: DynamicRouteNode[];
}
