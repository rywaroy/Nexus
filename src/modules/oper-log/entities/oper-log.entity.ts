import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * 业务类型枚举
 */
export enum BusinessTypeEnum {
    /** 其它 */
    OTHER = 0,
    /** 新增 */
    INSERT = 1,
    /** 修改 */
    UPDATE = 2,
    /** 删除 */
    DELETE = 3,
    /** 授权 */
    GRANT = 4,
    /** 导出 */
    EXPORT = 5,
    /** 导入 */
    IMPORT = 6,
    /** 强退 */
    FORCE = 7,
    /** 生成代码 */
    GENCODE = 8,
    /** 清空数据 */
    CLEAN = 9,
}

/**
 * 操作状态枚举
 */
export enum OperStatusEnum {
    /** 成功 */
    SUCCESS = 0,
    /** 失败 */
    FAIL = 1,
}

@Schema({ timestamps: true })
export class OperLog {
    /** 模块标题 */
    @Prop({ required: true })
    title: string;

    /** 业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8生成代码 9清空数据） */
    @Prop({ default: BusinessTypeEnum.OTHER })
    businessType: number;

    /** 请求方法（Controller.handler） */
    @Prop()
    method: string;

    /** 请求方式（GET/POST/PUT/DELETE） */
    @Prop()
    requestMethod: string;

    /** 操作人员 */
    @Prop()
    operName: string;

    /** 部门名称 */
    @Prop()
    deptName: string;

    /** 请求URL */
    @Prop()
    operUrl: string;

    /** 请求IP */
    @Prop()
    operIp: string;

    /** 操作地点 */
    @Prop()
    operLocation: string;

    /** 请求参数 */
    @Prop({ type: String })
    operParam: string;

    /** 返回参数 */
    @Prop({ type: String })
    jsonResult: string;

    /** 操作状态（0正常 1异常） */
    @Prop({ default: OperStatusEnum.SUCCESS })
    status: number;

    /** 错误消息 */
    @Prop()
    errorMsg: string;

    /** 操作时间 */
    @Prop({ default: () => new Date() })
    operTime: Date;

    /** 消耗时间（毫秒） */
    @Prop({ default: 0 })
    costTime: number;
}

export type OperLogDocument = HydratedDocument<OperLog>;

export const OperLogSchema = SchemaFactory.createForClass(OperLog);

// 添加索引以提高查询性能
OperLogSchema.index({ operTime: -1 });
OperLogSchema.index({ title: 1 });
OperLogSchema.index({ operName: 1 });
OperLogSchema.index({ businessType: 1 });
OperLogSchema.index({ status: 1 });
