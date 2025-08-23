import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    async login(createUserDto: CreateUserDto) {
        const { username, password } = createUserDto;
        const user = await this.userModel.findOne({ username }).lean();
        if (!user) {
            throw new HttpException({ message: '用户不存在' }, 201);
        }
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new HttpException({ message: '密码错误' }, 201);
        }
        return {
            _id: user._id.toString(),
            username: user.username,
            roles: user.roles,
        };
    }

    async createToken(user: any): Promise<string> {
        return this.jwtService.sign(user);
    }

    async logout(): Promise<void> {
        return;
    }
}
