import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() createUserDto: CreateUserDto) {
        const user = await this.authService.login(createUserDto);
        const token = await this.authService.createToken(user);
        return {
            accessToken: token,
            id: user._id,
            username: user.username,
            roles: user.roles,
        };
    }

    @Post('logout')
    async logout() {
        await this.authService.logout();
        return {
            message: '登出成功，请在客户端删除本地存储的 token',
        };
    }
}
