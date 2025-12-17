import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.login(loginDto);
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
