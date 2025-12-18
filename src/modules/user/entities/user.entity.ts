import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  /** 用户昵称 */
  @Prop({ required: true })
  nickName: string;

  /** 邮箱（唯一，可为空） */
  @Prop({ unique: true, sparse: true })
  email?: string;

  /** 手机号（唯一，可为空） */
  @Prop({ unique: true, sparse: true })
  phone?: string;

  /** 头像 URL */
  @Prop()
  avatar?: string;

  /** 状态：0-启用，1-停用 */
  @Prop({ default: 0 })
  status: number;

  /** 部门ID */
  @Prop({ type: Types.ObjectId, ref: 'Dept' })
  deptId?: Types.ObjectId;

  /** 备注 */
  @Prop()
  remark?: string;

  /** 角色名称列表，默认 user */
  @Prop({
    type: [String],
    default: ['user'],
    required: true,
  })
  roles: string[];
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
