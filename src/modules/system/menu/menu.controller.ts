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
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 创建菜单
   * POST /api/menu
   */
  @Post()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('system:menu:create')
  @Log({ title: '菜单管理', businessType: BusinessTypeEnum.INSERT })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  /**
   * 查询菜单列表（返回树结构）
   * GET /api/menu/list
   */
  @Get('list')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('system:menu:list')
  findAll(@Query() query: QueryMenuDto) {
    return this.menuService.findAll(query);
  }

  /**
   * 获取菜单树（用于选择器）
   * GET /api/menu/tree
   */
  @Get('tree')
  @UseGuards(AuthGuard)
  getMenuTree() {
    return this.menuService.getMenuTree();
  }

  /**
   * 获取动态路由（用于前端动态菜单）
   * 根据当前用户角色过滤返回的菜单
   * GET /api/menu/routes
   */
  @UseGuards(AuthGuard)
  @Get('routes')
  getRoutes(@Request() req) {
    // 从 Prisma 关联对象中提取角色名称
    const userRoles: string[] =
      req.user?.roles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];
    return this.menuService.getRoutesByRoles(userRoles);
  }

  /**
   * 获取当前用户的权限码列表（用于前端按钮级权限控制）
   * GET /api/menu/codes
   */
  @UseGuards(AuthGuard)
  @Get('codes')
  getAccessCodes(@Request() req) {
    // 从 Prisma 关联对象中提取角色名称
    const userRoles: string[] =
      req.user?.roles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];
    return this.menuService.getAccessCodesByRoles(userRoles);
  }

  /**
   * 检查菜单名称是否存在
   * GET /api/menu/name-exists
   */
  @Get('name-exists')
  @UseGuards(AuthGuard)
  async checkNameExists(@Query('name') name: string, @Query('id') id?: string) {
    return this.menuService.checkNameExists(name, id);
  }

  /**
   * 检查路由路径是否存在
   * GET /api/menu/path-exists
   */
  @Get('path-exists')
  @UseGuards(AuthGuard)
  async checkPathExists(@Query('path') path: string, @Query('id') id?: string) {
    return this.menuService.checkPathExists(path, id);
  }

  /**
   * 查询菜单详情
   * GET /api/menu/:id
   */
  @Get(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('system:menu:query')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  /**
   * 更新菜单
   * PUT /api/menu/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('system:menu:update')
  @Log({ title: '菜单管理', businessType: BusinessTypeEnum.UPDATE })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  /**
   * 删除菜单
   * DELETE /api/menu/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('system:menu:delete')
  @Log({ title: '菜单管理', businessType: BusinessTypeEnum.DELETE })
  remove(@Param('id') id: string) {
    return this.menuService.delete(id);
  }
}
