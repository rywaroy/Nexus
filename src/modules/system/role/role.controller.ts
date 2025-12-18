import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

@Controller('system/role')
@UseGuards(AuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 获取角色列表
   */
  @Get('list')
  @RequirePermission('system:role:list')
  async list(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query);
  }

  /**
   * 获取所有启用的角色（用于下拉选择）
   */
  @Get('options')
  async options() {
    return this.roleService.findAllEnabled();
  }

  /**
   * 获取角色详情
   */
  @Get(':id')
  @RequirePermission('system:role:query')
  async detail(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  /**
   * 创建角色
   */
  @Post()
  @RequirePermission('system:role:create')
  @Log({ title: '角色管理', businessType: BusinessTypeEnum.INSERT })
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  /**
   * 更新角色
   */
  @Put(':id')
  @RequirePermission('system:role:update')
  @Log({ title: '角色管理', businessType: BusinessTypeEnum.UPDATE })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  /**
   * 删除角色
   */
  @Delete(':id')
  @RequirePermission('system:role:delete')
  @Log({ title: '角色管理', businessType: BusinessTypeEnum.DELETE })
  async remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
