import {
    Controller,
    Get,
    Delete,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperLogService } from './oper-log.service';
import { QueryOperLogDto } from './dto/oper-log.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorator/permission.decorator';
import { Log } from '../../common/decorator/log.decorator';
import { BusinessTypeEnum } from './entities/oper-log.entity';

@ApiTags('操作日志管理')
@ApiBearerAuth()
@Controller('monitor/operlog')
@UseGuards(AuthGuard, PermissionGuard)
export class OperLogController {
    constructor(private readonly operLogService: OperLogService) {}

    @ApiOperation({ summary: '查询操作日志列表' })
    @Get('list')
    @RequirePermission('monitor:operlog:list')
    async findAll(@Query() queryOperLogDto: QueryOperLogDto) {
        return this.operLogService.findAll(queryOperLogDto);
    }

    @ApiOperation({ summary: '查询操作日志详情' })
    @Get(':id')
    @RequirePermission('monitor:operlog:query')
    async findOne(@Param('id') id: string) {
        return this.operLogService.findOne(id);
    }

    @ApiOperation({ summary: '清空操作日志' })
    @Delete('clean')
    @RequirePermission('monitor:operlog:delete')
    // 注意：清空操作日志不记录日志，避免循环
    async clean() {
        return this.operLogService.clean();
    }

    @ApiOperation({ summary: '删除操作日志' })
    @Delete(':ids')
    @RequirePermission('monitor:operlog:delete')
    @Log({ title: '操作日志管理', businessType: BusinessTypeEnum.DELETE })
    async remove(@Param('ids') ids: string) {
        const idArray = ids.split(',').filter((id) => id.trim());
        return this.operLogService.remove(idArray);
    }
}
