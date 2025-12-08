import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 菜单类型枚举
 * - catalog: 目录（仅用于分组，不对应实际页面）
 * - menu: 菜单（对应实际页面）
 * - button: 按钮（权限标识，不参与路由）
 * - embedded: 内嵌页面（iframe）
 * - link: 外链
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

@Schema({ timestamps: true })
export class Menu {
    /** 菜单名称（路由 name，必须唯一） */
    @Prop({ required: true, unique: true })
    name: string;

    /** 菜单标题（用于显示） */
    @Prop({ required: true })
    title: string;

    /** 父级菜单ID */
    @Prop({ type: Types.ObjectId, ref: 'Menu', default: null })
    parentId: Types.ObjectId | null;

    /** 路由路径 */
    @Prop({ required: true })
    path: string;

    /** 组件路径 */
    @Prop()
    component?: string;

    /** 菜单类型 */
    @Prop({ required: true, enum: Object.values(MenuType) })
    type: MenuType;

    /** 权限标识 */
    @Prop()
    authCode?: string;

    /** 排序值，越小越靠前 */
    @Prop({ default: 0 })
    order: number;

    /** 状态：0-启用，1-停用 */
    @Prop({ default: 0 })
    status: number;

    /** 菜单图标 */
    @Prop()
    icon?: string;

    /** 激活时的图标 */
    @Prop()
    activeIcon?: string;

    /** 是否缓存页面 */
    @Prop({ default: false })
    keepAlive: boolean;

    /** 是否固定在标签栏 */
    @Prop({ default: false })
    affixTab: boolean;

    /** 是否在菜单中隐藏 */
    @Prop({ default: false })
    hideInMenu: boolean;

    /** 是否在菜单中隐藏子级 */
    @Prop({ default: false })
    hideChildrenInMenu: boolean;

    /** 是否在面包屑中隐藏 */
    @Prop({ default: false })
    hideInBreadcrumb: boolean;

    /** 是否在标签页中隐藏 */
    @Prop({ default: false })
    hideInTab: boolean;

    /** iframe 地址（type 为 embedded 时使用） */
    @Prop()
    iframeSrc?: string;

    /** 外链地址（type 为 link 时使用） */
    @Prop()
    link?: string;

    /** 激活路径（当访问此路由时，激活指定菜单） */
    @Prop()
    activePath?: string;

    /** 徽标内容 */
    @Prop()
    badge?: string;

    /** 徽标类型 */
    @Prop({ enum: Object.values(BadgeType) })
    badgeType?: BadgeType;

    /** 徽标颜色 */
    @Prop({ enum: Object.values(BadgeVariants) })
    badgeVariants?: BadgeVariants;
}

export type MenuDocument = HydratedDocument<Menu>;

export const MenuSchema = SchemaFactory.createForClass(Menu);

// 创建索引
MenuSchema.index({ parentId: 1 });
MenuSchema.index({ order: 1 });
MenuSchema.index({ status: 1 });
