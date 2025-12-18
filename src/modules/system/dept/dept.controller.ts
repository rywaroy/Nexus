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
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';

@Controller('system/dept')
@UseGuards(AuthGuard, PermissionGuard)
export class DeptController {
  constructor(private readonly deptService: DeptService) { }

  /**
   * 获取部门列表（树形结构）
   * GET /api/system/dept/list
   */
  @Get('list')
  @RequirePermission('system:dept:list')
  findAll(@Query() query: QueryDeptDto) {
    return this.deptService.findAll(query);
  }

  /**
   * 创建部门
   * POST /api/system/dept
   */
  @Post()
  @RequirePermission('system:dept:create')
  @Log({ title: '部门管理', businessType: BusinessTypeEnum.INSERT })
  create(@Body() dto: CreateDeptDto) {
    return this.deptService.create(dto);
  }

  /**
   * 更新部门
   * PUT /api/system/dept/:id
   */
  @Put(':id')
  @RequirePermission('system:dept:update')
  @Log({ title: '部门管理', businessType: BusinessTypeEnum.UPDATE })
  update(@Param('id') id: string, @Body() dto: UpdateDeptDto) {
    return this.deptService.update(id, dto);
  }

  /**
   * 删除部门
   * DELETE /api/system/dept/:id
   */
  @Delete(':id')
  @RequirePermission('system:dept:delete')
  @Log({ title: '部门管理', businessType: BusinessTypeEnum.DELETE })
  remove(@Param('id') id: string) {
    return this.deptService.remove(id);
  }
}
