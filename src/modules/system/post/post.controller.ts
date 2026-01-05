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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

@ApiTags('岗位管理')
@Controller('system/post')
@UseGuards(AuthGuard, PermissionGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('list')
  @ApiOperation({ summary: '获取岗位列表' })
  @RequirePermission('system:post:list')
  findAll(@Query() query: QueryPostDto) {
    return this.postService.findAll(query);
  }

  @Get('options')
  @ApiOperation({ summary: '获取岗位选项' })
  findAllEnabled() {
    return this.postService.findAllEnabled();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取岗位详情' })
  @RequirePermission('system:post:query')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建岗位' })
  @RequirePermission('system:post:create')
  @Log({ title: '岗位管理', businessType: BusinessTypeEnum.INSERT })
  create(@Body() dto: CreatePostDto) {
    return this.postService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新岗位' })
  @RequirePermission('system:post:update')
  @Log({ title: '岗位管理', businessType: BusinessTypeEnum.UPDATE })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除岗位' })
  @RequirePermission('system:post:delete')
  @Log({ title: '岗位管理', businessType: BusinessTypeEnum.DELETE })
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
