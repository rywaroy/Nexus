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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorator/permission.decorator';
import { Log } from '@/common/decorator/log.decorator';
import { BusinessTypeEnum } from '../oper-log/entities/oper-log.entity';
import { IsId } from '@/common/decorators/is-id.decorator';
import { DictService } from './dict.service';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { QueryDictTypeDto } from './dto/query-dict-type.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';
import { QueryDictDataDto } from './dto/query-dict-data.dto';

class DictIdParamDto {
  @IsId({ message: 'ID格式不正确' })
  id: string;
}

@ApiTags('系统管理 - 字典管理')
@Controller('system/dict')
@UseGuards(AuthGuard, PermissionGuard)
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('type/list')
  @ApiOperation({ summary: '获取字典类型列表' })
  @RequirePermission('system:dict:list')
  findTypeList(@Query() query: QueryDictTypeDto) {
    return this.dictService.findTypeList(query);
  }

  @Get('type/options')
  @ApiOperation({ summary: '获取字典类型选项' })
  @RequirePermission('system:dict:query')
  findTypeOptions() {
    return this.dictService.findTypeOptions();
  }

  @Get('type/:id')
  @ApiOperation({ summary: '获取字典类型详情' })
  @RequirePermission('system:dict:query')
  findTypeById(@Param() { id }: DictIdParamDto) {
    return this.dictService.findTypeById(id);
  }

  @Post('type')
  @ApiOperation({ summary: '创建字典类型' })
  @RequirePermission('system:dict:create')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.INSERT })
  createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto);
  }

  @Put('type/:id')
  @ApiOperation({ summary: '更新字典类型' })
  @RequirePermission('system:dict:update')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.UPDATE })
  updateType(@Param() { id }: DictIdParamDto, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto);
  }

  @Delete('type/:id')
  @ApiOperation({ summary: '删除字典类型' })
  @RequirePermission('system:dict:delete')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.DELETE })
  deleteType(@Param() { id }: DictIdParamDto) {
    return this.dictService.deleteType(id);
  }

  @Delete('cache')
  @ApiOperation({ summary: '刷新字典缓存' })
  @RequirePermission('system:dict:update')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.CLEAN })
  refreshCache() {
    return this.dictService.refreshCache();
  }

  @Get('data/list')
  @ApiOperation({ summary: '获取字典数据列表' })
  @RequirePermission('system:dict:query')
  findDataList(@Query() query: QueryDictDataDto) {
    return this.dictService.findDataList(query);
  }

  @Get('data/type/:dictType')
  @ApiOperation({ summary: '根据字典类型获取字典数据' })
  @RequirePermission('system:dict:query')
  findDictDataByType(@Param('dictType') dictType: string) {
    return this.dictService.findDictDataByType(dictType);
  }

  @Get('data/:id')
  @ApiOperation({ summary: '获取字典数据详情' })
  @RequirePermission('system:dict:query')
  findDataById(@Param() { id }: DictIdParamDto) {
    return this.dictService.findDataById(id);
  }

  @Post('data')
  @ApiOperation({ summary: '创建字典数据' })
  @RequirePermission('system:dict:create')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.INSERT })
  createData(@Body() dto: CreateDictDataDto) {
    return this.dictService.createData(dto);
  }

  @Put('data/:id')
  @ApiOperation({ summary: '更新字典数据' })
  @RequirePermission('system:dict:update')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.UPDATE })
  updateData(@Param() { id }: DictIdParamDto, @Body() dto: UpdateDictDataDto) {
    return this.dictService.updateData(id, dto);
  }

  @Delete('data/:id')
  @ApiOperation({ summary: '删除字典数据' })
  @RequirePermission('system:dict:delete')
  @Log({ title: '字典管理', businessType: BusinessTypeEnum.DELETE })
  deleteData(@Param() { id }: DictIdParamDto) {
    return this.dictService.deleteData(id);
  }
}
