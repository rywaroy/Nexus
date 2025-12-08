import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 创建菜单
   * POST /api/menu
   */
  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  /**
   * 查询菜单列表（返回树结构）
   * GET /api/menu/list
   */
  @Get('list')
  findAll(@Query() query: QueryMenuDto) {
    return this.menuService.findAll(query);
  }

  /**
   * 获取菜单树（用于选择器）
   * GET /api/menu/tree
   */
  @Get('tree')
  getMenuTree() {
    return this.menuService.getMenuTree();
  }

  /**
   * 获取动态路由（用于前端动态菜单）
   * GET /api/menu/routes
   */
  @Get('routes')
  getRoutes() {
    return this.menuService.getRoutes();
  }

  /**
   * 检查菜单名称是否存在
   * GET /api/menu/name-exists
   */
  @Get('name-exists')
  async checkNameExists(@Query('name') name: string, @Query('id') id?: string) {
    return this.menuService.checkNameExists(name, id);
  }

  /**
   * 检查路由路径是否存在
   * GET /api/menu/path-exists
   */
  @Get('path-exists')
  async checkPathExists(@Query('path') path: string, @Query('id') id?: string) {
    return this.menuService.checkPathExists(path, id);
  }

  /**
   * 查询菜单详情
   * GET /api/menu/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  /**
   * 更新菜单
   * PUT /api/menu/:id
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  /**
   * 删除菜单
   * DELETE /api/menu/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.delete(id);
  }
}
