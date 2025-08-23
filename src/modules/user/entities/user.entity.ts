import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Role {
    SUPER = 'super',
    ADMIN = 'admin',
    USER = 'user',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        type: [String],
        enum: [Role.SUPER, Role.ADMIN, Role.USER],
        default: [Role.USER],
        required: true,
    })
    roles: Role[];
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
