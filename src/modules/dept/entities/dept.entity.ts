import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 部门实体
 * 用于组织架构管理，支持树形结构
 */
@Schema({ timestamps: true })
export class Dept {
    /** 部门名称 */
    @Prop({ required: true })
    name: string;

    /** 父级部门ID，根节点为 null */
    @Prop({ type: Types.ObjectId, ref: 'Dept', default: null })
    pid: Types.ObjectId | null;

    /** 状态：0-启用，1-停用 */
    @Prop({ default: 0 })
    status: number;

    /** 备注 */
    @Prop()
    remark?: string;
}

export type DeptDocument = HydratedDocument<Dept>;
export const DeptSchema = SchemaFactory.createForClass(Dept);

// 索引：父级查询优化
DeptSchema.index({ pid: 1 });
// 索引：状态过滤优化
DeptSchema.index({ status: 1 });
// 复合唯一索引：同一父级下部门名称唯一
DeptSchema.index({ pid: 1, name: 1 }, { unique: true });
