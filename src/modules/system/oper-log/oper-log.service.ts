import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { filterValidDatabaseIds } from '@/common/utils';
import { CreateOperLogDto, QueryOperLogDto } from './dto/oper-log.dto';

@Injectable()
export class OperLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建操作日志
   */
  async create(dto: CreateOperLogDto) {
    return this.prisma.operLog.create({
      data: {
        title: dto.title,
        businessType: dto.businessType ?? 0,
        method: dto.method,
        requestMethod: dto.requestMethod,
        operName: dto.operName,
        deptName: dto.deptName,
        operUrl: dto.operUrl,
        operIp: dto.operIp,
        operLocation: dto.operLocation,
        operParam: dto.operParam,
        jsonResult: dto.jsonResult,
        status: dto.status ?? 0,
        errorMsg: dto.errorMsg,
        costTime: dto.costTime ?? 0,
      },
    });
  }

  /**
   * 分页查询操作日志列表
   */
  async findAll(query: QueryOperLogDto): Promise<{
    list: any[];
    total: number;
  }> {
    const {
      title,
      operName,
      businessType,
      status,
      beginTime,
      endTime,
      page = 1,
      pageSize = 10,
    } = query;

    // 构建查询条件
    const where: any = {};

    if (title) {
      where.title = { contains: title };
    }

    if (operName) {
      where.operName = { contains: operName };
    }

    if (businessType !== undefined && businessType !== null) {
      where.businessType = businessType;
    }

    if (status !== undefined && status !== null) {
      where.status = status;
    }

    if (beginTime || endTime) {
      where.operTime = {};
      if (beginTime) {
        where.operTime.gte = new Date(beginTime);
      }
      if (endTime) {
        // 结束时间加一天，包含当天
        const end = new Date(endTime);
        end.setDate(end.getDate() + 1);
        where.operTime.lt = end;
      }
    }

    // 计算分页参数
    const skip = (page - 1) * pageSize;

    // 并行执行查询和计数
    const [list, total] = await Promise.all([
      this.prisma.operLog.findMany({
        where,
        orderBy: { operTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.operLog.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 根据ID查询操作日志详情
   */
  async findOne(id: string) {
    return this.prisma.operLog.findUnique({ where: { id } });
  }

  /**
   * 批量删除操作日志
   */
  async remove(ids: string[]): Promise<{ deletedCount: number }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deletedCount: 0 };
    }

    // 过滤出有效的数据库 ID，忽略无效的
    const validIds = filterValidDatabaseIds(ids);
    if (validIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await this.prisma.operLog.deleteMany({
      where: { id: { in: validIds } },
    });

    return { deletedCount: result.count };
  }

  /**
   * 清空所有操作日志
   */
  async clean(): Promise<{ deletedCount: number }> {
    const result = await this.prisma.operLog.deleteMany({});
    return { deletedCount: result.count };
  }
}
