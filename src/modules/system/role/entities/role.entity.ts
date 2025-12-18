import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * 内置角色名称
 */
export const BUILTIN_ROLES = ['admin'] as const;

@Schema({ timestamps: true })
export class Role {
  /** 角色名称（唯一） */
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  /** 关联的菜单ID数组（用于权限控制） */
  @Prop({ type: [String], default: [] })
  permissions: string[];

  /** 备注 */
  @Prop({ default: '' })
  remark: string;

  /** 状态：0-启用，1-停用 */
  @Prop({ type: Number, default: 0, enum: [0, 1] })
  status: number;
}

export type RoleDocument = HydratedDocument<Role>;

export const RoleSchema = SchemaFactory.createForClass(Role);

// 创建索引
RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ status: 1 });
