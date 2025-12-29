/**
 * 菜单类型枚举
 * - catalog: 目录（仅用于分组，不对应实际页面）
 * - menu: 菜单（对应实际页面）
 * - button: 按钮（权限标识，不参与路由）
 * - embedded: 内嵌页面（iframe）
 * - link: 外链
 *
 * 注意：Prisma Schema 中使用大写（CATALOG, MENU, BUTTON, EMBEDDED, LINK）
 * 应用层使用小写值进行转换
 */
export enum MenuType {
  CATALOG = 'catalog',
  MENU = 'menu',
  BUTTON = 'button',
  EMBEDDED = 'embedded',
  LINK = 'link',
}

/**
 * 徽标类型枚举
 */
export enum BadgeType {
  DOT = 'dot',
  NORMAL = 'normal',
}

/**
 * 徽标颜色枚举
 */
export enum BadgeVariants {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  PRIMARY = 'primary',
  SUCCESS = 'success',
  WARNING = 'warning',
}
