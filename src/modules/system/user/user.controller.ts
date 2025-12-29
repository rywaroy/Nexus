import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  QueryUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from './dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

/** 更新状态 DTO */
class UpdateStatusDto {
  @Type(() => Number)
  @IsIn([0, 1], { message: '状态值只能是 0 或 1' })
  status: number;
}

/** 重置密码 DTO */
class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20, { message: '密码长度必须在 6-20 位之间' })
  password: string;
}

/**
 * 用户基础接口（注册、获取当前用户信息）
 * 路由前缀：/api/user
 */
@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * 获取当前登录用户信息
   * GET /api/user/info
   */
  @UseGuards(AuthGuard)
  @Get('info')
  @ApiOperation({ summary: '获取当前登录用户信息' })
  async getInfo(@Request() req) {
    // 使用 findById 返回标准化格式，避免暴露内部字段
    return this.userService.findById(req.user.id);
  }

  /**
   * 用户注册
   * POST /api/user/register
   * 使用 RegisterUserDto 限制可提交字段，防止提权
   */
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  register(@Body() dto: RegisterUserDto) {
    return this.userService.register(dto);
  }
}

/**
 * 系统用户管理接口
 * 路由前缀：/api/system/user
 * 需要认证和权限验证
 */
@ApiTags('系统管理 - 用户')
@Controller('system/user')
@UseGuards(AuthGuard, PermissionGuard)
export class SystemUserController {
  constructor(private readonly userService: UserService) { }

  /**
   * 用户列表（分页）
   * GET /api/system/user/list
   */
  @Get('list')
  @RequirePermission('system:user:list')
  @ApiOperation({ summary: '获取用户列表' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  /**
   * 用户详情
   * GET /api/system/user/:id
   */
  @Get(':id')
  @RequirePermission('system:user:query')
  @ApiOperation({ summary: '获取用户详情' })
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  /**
   * 新增用户
   * POST /api/system/user
   */
  @Post()
  @RequirePermission('system:user:create')
  @Log({ title: '用户管理', businessType: BusinessTypeEnum.INSERT })
  @ApiOperation({ summary: '新增用户' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  /**
   * 更新用户
   * PUT /api/system/user/:id
   */
  @Put(':id')
  @RequirePermission('system:user:update')
  @Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE })
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  /**
   * 删除用户
   * DELETE /api/system/user/:id
   */
  @Delete(':id')
  @RequirePermission('system:user:delete')
  @Log({ title: '用户管理', businessType: BusinessTypeEnum.DELETE })
  @ApiOperation({ summary: '删除用户' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  /**
   * 更新用户状态
   * PUT /api/system/user/:id/status
   */
  @Put(':id/status')
  @RequirePermission('system:user:update')
  @Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE })
  @ApiOperation({ summary: '更新用户状态' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.userService.updateStatus(id, dto.status);
  }

  /**
   * 重置用户密码
   * PUT /api/system/user/:id/reset-password
   */
  @Put(':id/reset-password')
  @RequirePermission('system:user:reset-password')
  @Log({ title: '用户管理', businessType: BusinessTypeEnum.UPDATE, isSaveRequestData: false })
  @ApiOperation({ summary: '重置用户密码' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto.password);
  }
}
